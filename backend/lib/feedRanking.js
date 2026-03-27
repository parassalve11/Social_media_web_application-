/**
 * lib/feedRanking.js
 * ─────────────────────────────────────────────────────────────────
 * Centralised MongoDB Aggregation Pipeline builders for the
 * Weighted Gravity Ranking System (2026 standard).
 *
 * Gravity Formula (posts):
 *   Score = (likes + comments×2 + bookmarks×5) / (ageInHours + 2)^1.5
 *
 * Gravity Formula (reels):
 *   Score = (likes + comments×2 + viewCount×0.3) / (ageInHours + 2)^1.5
 *   then × 1.2  (reel-format boost)
 *
 * Affinity Boost:
 *   × 1.2 if the post/reel author is in req.user.following[]
 *   × 1.0 otherwise  (cold-start safe)
 *
 * NOTE: "shares" is not yet in the schema. When you add a shares
 * counter field later, include it as  + shares×10  in the formula.
 * ─────────────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";

/* ═══════════════════════════════════════════════════════════════
   SHARED HELPERS
═══════════════════════════════════════════════════════════════ */

/**
 * Converts a raw MongoDB ObjectId cursor string into a safe $lt filter.
 * Returns an empty object when cursor is absent / invalid (first page).
 */
export const buildCursorMatch = (cursor) => {
  if (!cursor || !mongoose.isValidObjectId(cursor)) return {};
  return { _id: { $lt: new mongoose.Types.ObjectId(cursor) } };
};

/**
 * Builds the $lookup + $unwind stages that replace Mongoose .populate()
 * for the author field.  Using a pipeline-based lookup lets us project
 * only the fields we need, keeping documents small.
 */
export const buildAuthorLookup = () => [
  {
    $lookup: {
      from: "users",
      localField: "author",
      foreignField: "_id",
      as: "author",
      pipeline: [
        {
          $project: {
            name: 1,
            username: 1,
            avatar: 1,
            bio: 1,
            followers: 1,
            following: 1,
            isVerified: 1,
          },
        },
      ],
    },
  },
  { $unwind: "$author" },
];

/**
 * Builds $lookup + array-merge stages to hydrate comments.user
 * (equivalent to .populate("comments.user")).
 */
export const buildCommentUsersLookup = () => [
  {
    $lookup: {
      from: "users",
      localField: "comments.user",
      foreignField: "_id",
      as: "_commentUsers",
      pipeline: [
        {
          $project: {
            name: 1,
            username: 1,
            avatar: 1,
            bio: 1,
            followers: 1,
            following: 1,
          },
        },
      ],
    },
  },
  {
    // Zip the hydrated user docs back into each comment sub-document
    $addFields: {
      comments: {
        $map: {
          input: "$comments",
          as: "c",
          in: {
            $mergeObjects: [
              "$$c",
              {
                user: {
                  $arrayElemAt: [
                    "$_commentUsers",
                    {
                      $indexOfArray: ["$_commentUsers._id", "$$c.user"],
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    },
  },
  { $unset: "_commentUsers" },
];

/* ═══════════════════════════════════════════════════════════════
   POST PIPELINE STAGES
═══════════════════════════════════════════════════════════════ */

/**
 * buildPostScoringStages
 * ─────────────────────
 * Returns the $addFields stages that attach a `_finalScore` to every
 * Post document inside an aggregation pipeline.
 *
 * @param {Object[]} followingIds  - Array of ObjectIds the current user follows.
 *                                   Pass [] for anonymous / cold-start users.
 */
export const buildPostScoringStages = (followingIds = []) => {
  // Serialise to strings once so the $in expression works cleanly
  const followingStrings = followingIds.map((id) => id.toString());

  return [
    /* ── 1. Raw engagement counts from arrays ── */
    {
      $addFields: {
        _likesCount:     { $size: { $ifNull: ["$likes",     []] } },
        _commentsCount:  { $size: { $ifNull: ["$comments",  []] } },
        _bookmarksCount: { $size: { $ifNull: ["$bookmarks", []] } },
        // shares field doesn't exist yet → treated as 0
        _sharesCount: 0,
      },
    },

    /* ── 2. Age in hours since creation ── */
    {
      $addFields: {
        _ageInHours: {
          $divide: [
            { $subtract: ["$$NOW", "$createdAt"] },
            3_600_000, // ms → hours
          ],
        },
      },
    },

    /* ── 3. Gravity raw score ──
       (likes + comments×2 + bookmarks×5) / (age + 2)^1.5
    ── */
    {
      $addFields: {
        _rawScore: {
          $divide: [
            {
              $add: [
                "$_likesCount",
                { $multiply: ["$_commentsCount",  2] },
                { $multiply: ["$_bookmarksCount", 5] },
                { $multiply: ["$_sharesCount",   10] },
              ],
            },
            {
              // (ageInHours + 2) ^ 1.5  via  x^1.5 = x * sqrt(x)
              $let: {
                vars: { base: { $add: ["$_ageInHours", 2] } },
                in: {
                  $multiply: [
                    "$$base",
                    { $sqrt: "$$base" }, // base^0.5  →  base * base^0.5 = base^1.5
                  ],
                },
              },
            },
          ],
        },
      },
    },

    /* ── 4. Affinity boost: ×1.2 if author is followed by current user ── */
    {
      $addFields: {
        _affinityBoost: {
          $cond: {
            // Convert author ObjectId to string for the $in comparison
            if: {
              $in: [
                { $toString: "$author" },
                followingStrings,
              ],
            },
            then: 1.2,
            else: 1.0,
          },
        },
      },
    },

    /* ── 5. Final score ── */
    {
      $addFields: {
        _finalScore: { $multiply: ["$_rawScore", "$_affinityBoost"] },
      },
    },
  ];
};

/**
 * buildPostCleanupStage
 * ─────────────────────
 * Removes all internal _ prefixed helper fields from the output document.
 * Call this as the last stage before returning results to the client.
 */
export const buildPostCleanupStage = () => ({
  $unset: [
    "_likesCount",
    "_commentsCount",
    "_bookmarksCount",
    "_sharesCount",
    "_ageInHours",
    "_rawScore",
    "_affinityBoost",
    "_finalScore",
  ],
});

/* ═══════════════════════════════════════════════════════════════
   REEL PIPELINE STAGES
═══════════════════════════════════════════════════════════════ */

/**
 * buildReelScoringStages
 * ──────────────────────
 * Same gravity formula as posts but adapted for the Reel schema:
 *  - No bookmarks  →  replaced by viewCount×0.3
 *  - Reel-format boost ×1.2 baked in at the end
 *
 * @param {Object[]} followingIds  - Array of ObjectIds the current user follows.
 */
export const buildReelScoringStages = (followingIds = []) => {
  const followingStrings = followingIds.map((id) => id.toString());

  return [
    /* ── 1. Raw engagement counts ── */
    {
      $addFields: {
        _likesCount:    { $size: { $ifNull: ["$likes",    []] } },
        _commentsCount: { $size: { $ifNull: ["$comments", []] } },
        // viewCount is already a Number field on Reel schema ✅
        _viewCount: { $ifNull: ["$viewCount", 0] },
      },
    },

    /* ── 2. Age in hours ── */
    {
      $addFields: {
        _ageInHours: {
          $divide: [
            { $subtract: ["$$NOW", "$createdAt"] },
            3_600_000,
          ],
        },
      },
    },

    /* ── 3. Gravity raw score ──
       (likes + comments×2 + viewCount×0.3) / (age + 2)^1.5
    ── */
    {
      $addFields: {
        _rawScore: {
          $divide: [
            {
              $add: [
                "$_likesCount",
                { $multiply: ["$_commentsCount", 2  ] },
                { $multiply: ["$_viewCount",     0.3] },
              ],
            },
            {
              $let: {
                vars: { base: { $add: ["$_ageInHours", 2] } },
                in: { $multiply: ["$$base", { $sqrt: "$$base" }] },
              },
            },
          ],
        },
      },
    },

    /* ── 4. Reel-format boost: ×1.2 always ── */
    {
      $addFields: {
        _reelBoost: 1.2,
      },
    },

    /* ── 5. Affinity boost ── */
    {
      $addFields: {
        _affinityBoost: {
          $cond: {
            if: { $in: [{ $toString: "$author" }, followingStrings] },
            then: 1.2,
            else: 1.0,
          },
        },
      },
    },

    /* ── 6. Final score = rawScore × reelBoost × affinityBoost ── */
    {
      $addFields: {
        _finalScore: {
          $multiply: ["$_rawScore", "$_reelBoost", "$_affinityBoost"],
        },
      },
    },
  ];
};

/**
 * buildReelCleanupStage
 * ──────────────────────
 * Strips all _ prefixed helper fields from Reel output.
 */
export const buildReelCleanupStage = () => ({
  $unset: [
    "_likesCount",
    "_commentsCount",
    "_viewCount",
    "_ageInHours",
    "_rawScore",
    "_reelBoost",
    "_affinityBoost",
    "_finalScore",
  ],
});

/* ═══════════════════════════════════════════════════════════════
   REEL AUTHOR LOOKUP  (simpler than posts — no comment-user zip)
═══════════════════════════════════════════════════════════════ */

export const buildReelAuthorLookup = () => [
  {
    $lookup: {
      from: "users",
      localField: "author",
      foreignField: "_id",
      as: "author",
      pipeline: [
        {
          $project: {
            name: 1,
            username: 1,
            avatar: 1,
            bio: 1,
            isVerified: 1,
          },
        },
      ],
    },
  },
  { $unwind: "$author" },
];

export const buildReelCommentUsersLookup = () => [
  {
    $lookup: {
      from: "users",
      localField: "comments.user",
      foreignField: "_id",
      as: "_commentUsers",
      pipeline: [
        {
          $project: { name: 1, username: 1, avatar: 1 },
        },
      ],
    },
  },
  {
    $addFields: {
      comments: {
        $map: {
          input: "$comments",
          as: "c",
          in: {
            $mergeObjects: [
              "$$c",
              {
                user: {
                  $arrayElemAt: [
                    "$_commentUsers",
                    { $indexOfArray: ["$_commentUsers._id", "$$c.user"] },
                  ],
                },
              },
            ],
          },
        },
      },
    },
  },
  { $unset: "_commentUsers" },
];

/* ═══════════════════════════════════════════════════════════════
   RECOMMENDED USERS PIPELINE  (Phase 5)
═══════════════════════════════════════════════════════════════ */

/**
 * buildRecommendedUsersPipeline
 * ──────────────────────────────
 * Returns a complete aggregation pipeline that scores every user
 * the current user does NOT follow and ranks them by:
 *
 *   UserScore = (mutualFollowers × 10)
 *             + (postsCount     × 0.5)
 *             + recencyBoost              ← up to +3 for accounts < 30 days old
 *
 * The pipeline is a single aggregate() call — no application-side
 * JS loops needed.
 *
 * @param {Object}    currentUser          - req.user (must have _id, following[])
 * @param {number}    [limit=10]           - max users to return
 * @returns {Array}   MongoDB pipeline stages
 */
export const buildRecommendedUsersPipeline = (currentUser, limit = 10) => {
  const userId       = currentUser._id;
  const followingIds = currentUser.following || [];

  // IDs to exclude: self + everyone already followed
  const excludeIds = [userId, ...followingIds];

  return [
    /* ── 1. Exclude self and already-followed users ── */
    {
      $match: {
        _id:          { $nin: excludeIds },
        emailVerified: true,           // only fully-onboarded accounts
      },
    },

    /* ── 2. Compute mutual-follower count ──────────────────────
       mutualCount = | currentUser.following ∩ candidate.followers |
       $setIntersection works on arrays of the same element type.
       Both sides are ObjectId arrays stored in MongoDB, so this
       comparison works natively without string conversion.
    ── */
    {
      $addFields: {
        _mutualCount: {
          $size: {
            $ifNull: [
              { $setIntersection: ["$followers", followingIds] },
              [],
            ],
          },
        },
      },
    },

    /* ── 3. Account age in days (for recency boost) ── */
    {
      $addFields: {
        _accountAgeDays: {
          $divide: [
            { $subtract: ["$$NOW", "$createdAt"] },
            86_400_000, // ms per day
          ],
        },
      },
    },

    /* ── 4. Recency boost: up to +3 pts for accounts < 30 days old ──
       formula: max(0,  (30 - ageDays) × 0.1 )
    ── */
    {
      $addFields: {
        _recencyBoost: {
          $max: [
            0,
            {
              $multiply: [
                { $subtract: [30, "$_accountAgeDays"] },
                0.1,
              ],
            },
          ],
        },
      },
    },

    /* ── 5. Final recommendation score ── */
    {
      $addFields: {
        _recScore: {
          $add: [
            { $multiply: ["$_mutualCount",                     10 ] },
            { $multiply: [{ $ifNull: ["$postsCount", 0] },    0.5 ] },
            "$_recencyBoost",
          ],
        },
      },
    },

    /* ── 6. Sort: highest score first, break ties by follower count ── */
    {
      $sort: {
        _recScore:        -1,
        _mutualCount:     -1,
        followersCount:   -1,  // synthetic; real size computed below if needed
        createdAt:        -1,
      },
    },

    /* ── 7. Limit ── */
    { $limit: limit },

    /* ── 8. Clean output — expose only safe public fields ── */
    {
      $project: {
        name:         1,
        username:     1,
        avatar:       1,
        bio:          1,
        isVerified:   1,
        postsCount:   1,
        followersCount: { $size: { $ifNull: ["$followers", []] } },
        mutualFollowers: "$_mutualCount",
        // Strip private / internal fields
        password:     0,
        email:        0,
        refreshTokenHash: 0,
        verificationTokenHash: 0,
        passwordResetTokenHash: 0,
        _mutualCount:     0,
        _accountAgeDays:  0,
        _recencyBoost:    0,
        _recScore:        0,
      },
    },
  ];
};
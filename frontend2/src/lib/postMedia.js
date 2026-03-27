export const guessMediaType = (url = "") => {
  const lower = String(url).toLowerCase();
  if (
    lower.includes("/video/") ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".m4v")
  ) {
    return "video";
  }
  return "image";
};

export const getPostMedia = (post = {}) => {
  if (Array.isArray(post.media) && post.media.length > 0) {
    return post.media
      .filter((item) => item?.url)
      .map((item) => ({
        url: item.url,
        type: item.type || guessMediaType(item.url),
      }));
  }

  if (Array.isArray(post.imageOrVideoUrl) && post.imageOrVideoUrl.length > 0) {
    return post.imageOrVideoUrl
      .filter(Boolean)
      .map((url) => ({ url, type: guessMediaType(url) }));
  }

  if (post.imageUrl) {
    return [{ url: post.imageUrl, type: guessMediaType(post.imageUrl) }];
  }

  if (post.image) {
    return [{ url: post.image, type: "image" }];
  }

  return [];
};

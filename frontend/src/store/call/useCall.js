// frontend/src/store/call/useCall.js
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "../../services/chat.service";

/* ─────────────────────────────────────────────────────
   ICE / STUN configuration
───────────────────────────────────────────────────── */
const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    // Add TURN server here for production:
    // { urls: "turn:your-turn-server.com", username: "user", credential: "pass" }
  ],
};

/* ─────────────────────────────────────────────────────
   Call status enum
───────────────────────────────────────────────────── */
export const CALL_STATUS = {
  IDLE:        "idle",
  OUTGOING:    "outgoing",    // we called, waiting for answer
  INCOMING:    "incoming",    // we received a call
  CONNECTING:  "connecting",  // SDP/ICE exchange in progress
  ACTIVE:      "active",      // fully connected
};

/* ─────────────────────────────────────────────────────
   Module-level singleton so ANY component can subscribe
───────────────────────────────────────────────────── */
let _listeners = new Set();
let _state = {
  status:          CALL_STATUS.IDLE,
  callId:          null,
  callType:        null,        // "video" | "audio"
  remoteUser:      null,        // { _id, username, avatar }
  localStream:     null,
  remoteStream:    null,
  isMuted:         false,
  isVideoOff:      false,
  isScreenSharing: false,
  remoteAudioMuted: false,
  remoteVideoOff:   false,
  duration:        0,           // seconds, counts while active
};

const setState = (patch) => {
  _state = { ..._state, ...patch };
  _listeners.forEach((fn) => fn(_state));
};

// Singleton RTCPeerConnection + timers
let _pc        = null;
let _durationInterval = null;
let _callSocketListenerCount = 0;
let _callSocketListenersBound = false;
let _callSocket = null;

/* ─────────────────────────────────────────────────────
   Hook
───────────────────────────────────────────────────── */
export const useCall = (currentUser) => {
  const [callState, setCallState] = useState(_state);

  // Subscribe to singleton state
  useEffect(() => {
    const fn = (s) => setCallState({ ...s });
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  }, []);

  /* ── Create RTCPeerConnection ── */
  const createPeerConnection = useCallback((remoteUserId) => {
    if (_pc) { _pc.close(); _pc = null; }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    _pc = pc;

    // Remote tracks → build remoteStream
    const remoteStream = new MediaStream();
    setState({ remoteStream });

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      setState({ remoteStream: new MediaStream(remoteStream.getTracks()) });
    };

    // ICE candidates → forward via socket
    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const socket = getSocket();
      socket?.emit("webrtc:ice-candidate", {
        callId: _state.callId,
        to:     remoteUserId,
        candidate: event.candidate,
      });
    };

    pc.onconnectionstatechange = () => {
      console.log("RTC connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setState({ status: CALL_STATUS.ACTIVE });
        startDurationTimer();
      }
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        handleCallEnded();
      }
    };

    return pc;
  }, []);

  /* ── Get user media ── */
  const getLocalMedia = useCallback(async (callType) => {
    const constraints = {
      audio: true,
      video: callType === "video"
        ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
        : false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    setState({ localStream: stream });
    return stream;
  }, []);

  /* ── Initiate call ── */
  const initiateCall = useCallback(async (remoteUser, callType) => {
    if (_state.status !== CALL_STATUS.IDLE) return;

    try {
      setState({
        status:     CALL_STATUS.OUTGOING,
        callType,
        remoteUser,
        localStream: null,
        remoteStream: null,
        isMuted: false,
        isVideoOff: false,
        duration: 0,
      });

      const stream = await getLocalMedia(callType);
      const socket = getSocket();

      socket?.emit("call:initiate", {
        callerId:   currentUser._id,
        receiverId: remoteUser._id,
        callType,
        callerInfo: {
          _id:      currentUser._id,
          name:     currentUser.name,
          username: currentUser.username,
          avatar:   currentUser.avatar,
        },
      });
    } catch (err) {
      console.error("initiateCall error:", err);
      // Permission denied etc.
      setState({ status: CALL_STATUS.IDLE });
    }
  }, [currentUser, getLocalMedia]);

  /* ── Accept call ── */
  const acceptCall = useCallback(async () => {
    if (_state.status !== CALL_STATUS.INCOMING) return;

    try {
      setState({ status: CALL_STATUS.CONNECTING });
      await getLocalMedia(_state.callType);

      const socket = getSocket();
      socket?.emit("call:accepted", {
        callId:     _state.callId,
        receiverId: currentUser._id,
      });
    } catch (err) {
      console.error("acceptCall error:", err);
      rejectCall("media_error");
    }
  }, [currentUser, getLocalMedia]);

  /* ── Reject call ── */
  const rejectCall = useCallback((reason = "rejected") => {
    const socket = getSocket();
    socket?.emit("call:rejected", {
      callId: _state.callId,
      reason,
    });
    cleanupCall();
  }, []);

  /* ── End active call ── */
  const endCall = useCallback(() => {
    const socket = getSocket();
    socket?.emit("call:end", {
      callId: _state.callId,
      to:     _state.remoteUser?._id,
    });
    cleanupCall();
  }, []);

  /* ── Toggle mute ── */
  const toggleMute = useCallback(() => {
    const stream = _state.localStream;
    if (!stream) return;
    const muted = !_state.isMuted;
    stream.getAudioTracks().forEach((t) => { t.enabled = !muted; });
    setState({ isMuted: muted });
    const socket = getSocket();
    socket?.emit("call:toggle-audio", {
      callId: _state.callId,
      to:     _state.remoteUser?._id,
      muted,
    });
  }, []);

  /* ── Toggle video ── */
  const toggleVideo = useCallback(() => {
    const stream = _state.localStream;
    if (!stream) return;
    const videoOff = !_state.isVideoOff;
    stream.getVideoTracks().forEach((t) => { t.enabled = !videoOff; });
    setState({ isVideoOff: videoOff });
    const socket = getSocket();
    socket?.emit("call:toggle-video", {
      callId:  _state.callId,
      to:      _state.remoteUser?._id,
      videoOff,
    });
  }, []);

  /* ── Screen share ── */
  const toggleScreenShare = useCallback(async () => {
    if (!_pc) return;

    if (_state.isScreenSharing) {
      // Switch back to camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoTrack = stream.getVideoTracks()[0];
        const sender = _pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(videoTrack);
        setState({ isScreenSharing: false, localStream: stream });
      } catch (err) {
        console.error("toggleScreenShare (back to camera):", err);
      }
    } else {
      // Switch to screen
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = _pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(screenTrack);
        screenTrack.onended = () => toggleScreenShare(); // auto-stop when user closes share
        setState({
          isScreenSharing: true,
          localStream: screenStream,
        });
      } catch (err) {
        console.error("toggleScreenShare (screen):", err);
      }
    }
  }, []);

  /* ── Internal: cleanup ── */
  const cleanupCall = useCallback(() => {
    stopDurationTimer();
    if (_state.localStream) {
      _state.localStream.getTracks().forEach((t) => t.stop());
    }
    if (_pc) { _pc.close(); _pc = null; }
    setState({
      status:          CALL_STATUS.IDLE,
      callId:          null,
      callType:        null,
      remoteUser:      null,
      localStream:     null,
      remoteStream:    null,
      isMuted:         false,
      isVideoOff:      false,
      isScreenSharing: false,
      remoteAudioMuted: false,
      remoteVideoOff:   false,
      duration:        0,
    });
  }, []);

  const handleCallEnded = useCallback(() => {
    cleanupCall();
  }, [cleanupCall]);

  /* ── Duration timer ── */
  const startDurationTimer = () => {
    stopDurationTimer();
    _durationInterval = setInterval(() => {
      setState({ duration: _state.duration + 1 });
    }, 1000);
  };
  const stopDurationTimer = () => {
    if (_durationInterval) { clearInterval(_durationInterval); _durationInterval = null; }
  };

  /* ──────────────────────────────────────────────────
     SOCKET EVENT LISTENERS (bind once globally)
  ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!currentUser) return;
    const socket = getSocket();
    if (!socket) return;

    _callSocketListenerCount += 1;

    const bindListeners = () => {
      /* -- call:ringing -- our outgoing call is ringing -- */
      socket.on("call:ringing", ({ callId }) => {
        setState({ callId });
      });

      /* -- call:incoming -- someone is calling us -- */
      socket.on("call:incoming", ({ callId, callerId, callType, callerInfo }) => {
        if (_state.status !== CALL_STATUS.IDLE) {
          // Already in a call - auto-reject
          socket.emit("call:rejected", { callId, reason: "busy" });
          return;
        }
        setState({
          status:     CALL_STATUS.INCOMING,
          callId,
          callType,
          remoteUser: { _id: callerId, ...callerInfo },
        });
      });

      /* -- call:accepted -- receiver accepted our outgoing call -- */
      socket.on("call:accepted", async ({ callId }) => {
        if (_state.status !== CALL_STATUS.OUTGOING) return;
        setState({ status: CALL_STATUS.CONNECTING });

        try {
          // Caller creates offer
          const pc = createPeerConnection(_state.remoteUser?._id);

          // Add local tracks
          _state.localStream?.getTracks().forEach((track) => {
            pc.addTrack(track, _state.localStream);
          });

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit("webrtc:offer", {
            callId,
            to:    _state.remoteUser?._id,
            offer,
          });
        } catch (err) {
          console.error("call:accepted - createOffer error:", err);
          endCall();
        }
      });

      /* -- call:rejected -- receiver rejected -- */
      socket.on("call:rejected", ({ callId, reason }) => {
        cleanupCall();
      });

      /* -- call:ended -- remote party ended -- */
      socket.on("call:ended", ({ callId }) => {
        cleanupCall();
      });

      /* -- call:busy -- receiver already in a call -- */
      socket.on("call:busy", ({ callId }) => {
        cleanupCall();
      });

      /* -- call:no_answer -- receiver is offline -- */
      socket.on("call:no_answer", ({ callId }) => {
        cleanupCall();
      });

      /* -- webrtc:offer -- receiver gets offer from caller -- */
      socket.on("webrtc:offer", async ({ callId, from, offer }) => {
        if (_state.status !== CALL_STATUS.CONNECTING) return;

        try {
          const pc = createPeerConnection(from);

          // Add local tracks
          _state.localStream?.getTracks().forEach((track) => {
            pc.addTrack(track, _state.localStream);
          });

          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit("webrtc:answer", {
            callId,
            to:     from,
            answer,
          });
        } catch (err) {
          console.error("webrtc:offer error:", err);
          endCall();
        }
      });

      /* -- webrtc:answer -- caller gets answer from receiver -- */
      socket.on("webrtc:answer", async ({ callId, from, answer }) => {
        try {
          if (_pc) {
            await _pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
        } catch (err) {
          console.error("webrtc:answer error:", err);
        }
      });

      /* -- webrtc:ice-candidate -- add ICE candidate -- */
      socket.on("webrtc:ice-candidate", async ({ callId, from, candidate }) => {
        try {
          if (_pc && candidate) {
            await _pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (err) {
          console.error("webrtc:ice-candidate error:", err);
        }
      });

      /* -- remote media toggles -- */
      socket.on("call:remote-audio-toggle", ({ muted }) => {
        setState({ remoteAudioMuted: muted });
      });

      socket.on("call:remote-video-toggle", ({ videoOff }) => {
        setState({ remoteVideoOff: videoOff });
      });
    };

    const unbindListeners = (targetSocket) => {
      if (!targetSocket) return;
      targetSocket.off("call:ringing");
      targetSocket.off("call:incoming");
      targetSocket.off("call:accepted");
      targetSocket.off("call:rejected");
      targetSocket.off("call:ended");
      targetSocket.off("call:busy");
      targetSocket.off("call:no_answer");
      targetSocket.off("webrtc:offer");
      targetSocket.off("webrtc:answer");
      targetSocket.off("webrtc:ice-candidate");
      targetSocket.off("call:remote-audio-toggle");
      targetSocket.off("call:remote-video-toggle");
    };

    if (!_callSocketListenersBound || _callSocket !== socket) {
      if (_callSocket && _callSocket !== socket) {
        unbindListeners(_callSocket);
      }
      _callSocket = socket;
      _callSocketListenersBound = true;
      bindListeners();
    }

    return () => {
      _callSocketListenerCount -= 1;
      if (_callSocketListenerCount <= 0 && _callSocket) {
        unbindListeners(_callSocket);
        _callSocketListenersBound = false;
        _callSocketListenerCount = 0;
        _callSocket = null;
      }
    };
  }, [currentUser, createPeerConnection, cleanupCall, endCall]);

  return {
    ...callState,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  };
};

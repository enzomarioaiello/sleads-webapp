/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  description?: string;
  type?: "youtube" | "vimeo" | "self-hosted";
  startTime?: number; // Start time in seconds
  endTime?: number; // End time in seconds
}

// YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function VideoModal({
  isOpen,
  onClose,
  videoUrl,
  title,
  description,
  type = "youtube",
  startTime = 0,
  endTime,
}: VideoModalProps) {
  const playerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLDivElement>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (type !== "youtube" || !isOpen) return;

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      return;
    }

    // Load the IFrame API script
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Set up callback
    window.onYouTubeIframeAPIReady = () => {
      // API is ready, player will be initialized in the next effect
    };

    return () => {
      // Cleanup
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore errors during cleanup
        }
        playerRef.current = null;
      }
    };
  }, [type, isOpen]);

  // Initialize YouTube player
  useEffect(() => {
    if (type !== "youtube" || !isOpen || !iframeRef.current) return;

    // Wait for API to be ready
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 100);
        return;
      }

      // Extract video ID
      const youtubeRegex =
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = videoUrl.match(youtubeRegex);
      const videoId = match ? match[1] : videoUrl;

      if (!videoId) return;

      // Destroy existing player if any
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore errors
        }
      }

      // Create new player
      playerRef.current = new window.YT.Player(iframeRef.current, {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          start: startTime,
          end: endTime,
          rel: 0,
          modestbranding: 1,
          hd: 1, // Request HD quality
          vq: "hd1080", // Request 1080p quality
          controls: 1,
        },
        events: {
          onReady: (event: any) => {
            event.target.playVideo();
          },
          onStateChange: (event: any) => {
            // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
            if (event.data === window.YT.PlayerState.ENDED) {
              // Video ended, close modal
              onClose();
            }
          },
        },
      });

      // Monitor playback time to stop at endTime
      if (endTime) {
        const checkTime = setInterval(() => {
          if (playerRef.current) {
            try {
              const currentTime = playerRef.current.getCurrentTime();
              if (currentTime >= endTime) {
                playerRef.current.pauseVideo();
                onClose();
                clearInterval(checkTime);
              }
            } catch (e) {
              // Ignore errors
            }
          }
        }, 100); // Check every 100ms

        return () => clearInterval(checkTime);
      }
    };

    initPlayer();

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore errors during cleanup
        }
        playerRef.current = null;
      }
    };
  }, [type, isOpen, videoUrl, startTime, endTime, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (playerRef.current) {
          try {
            playerRef.current.pauseVideo();
          } catch (e) {
            // Ignore errors
          }
        }
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Get embed URL based on type (fallback for non-YouTube or if API fails)
  const getEmbedUrl = () => {
    if (type === "youtube") {
      // Extract video ID from various YouTube URL formats
      const youtubeRegex =
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = videoUrl.match(youtubeRegex);
      const videoId = match ? match[1] : videoUrl;

      // Build query parameters with quality settings
      const params = new URLSearchParams({
        autoplay: "1",
        rel: "0",
        modestbranding: "1",
        hd: "1",
        vq: "hd1080", // Request 1080p quality
      });

      if (startTime > 0) {
        params.append("start", startTime.toString());
      }

      if (endTime) {
        params.append("end", endTime.toString());
      }

      return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    }

    if (type === "vimeo") {
      // Extract video ID from Vimeo URL
      const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
      const match = videoUrl.match(vimeoRegex);
      const videoId = match ? match[1] : videoUrl;
      return `https://player.vimeo.com/video/${videoId}?autoplay=1&quality=1080p`;
    }

    // Self-hosted video
    return videoUrl;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/80 dark:bg-black/90 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 z-10 text-white hover:text-slate-300 transition-colors"
            aria-label="Close video"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Video Container */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black">
            <div className="aspect-video">
              {type === "youtube" ? (
                // YouTube player container (will be initialized by IFrame API)
                <div
                  ref={iframeRef}
                  id={`youtube-player-${title.replace(/\s+/g, "-")}`}
                  className="w-full h-full"
                />
              ) : type === "self-hosted" ? (
                <video
                  src={getEmbedUrl()}
                  controls
                  autoPlay
                  className="w-full h-full"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <iframe
                  src={getEmbedUrl()}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={title}
                />
              )}
            </div>

            {/* Video Info */}
            {(title || description) && (
              <div className="p-6 bg-white dark:bg-sleads-slate900">
                {title && (
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-slate-600 dark:text-sleads-slate400">
                    {description}
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

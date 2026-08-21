import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AVATAR_ANIMATIONS,
  ANIMATION_RESET,
  CHAT_WIDGET_CONFIG,
} from "../constants/avatar-animations";

export function useWebAvatar() {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initial hidden state
    document.body.classList.add("avatar-hidden");

    (window as any).ChatWidgetConfig = { ...CHAT_WIDGET_CONFIG };

    // Load JSSDK script if not present
    let scriptElement: HTMLScriptElement | null = null;
    if (!document.getElementById("webavatar-jssdk")) {
      const s = document.createElement("script");
      s.id = "webavatar-jssdk";
      s.src = "https://webavatar.didthat.cc/chat-widget.js";
      s.async = true;
      (document.head || document.body).appendChild(s);
      scriptElement = s;
    }

    let connectedState = false;
    let animationTimeout: any = null;
    const minInterval = 30;
    const maxInterval = 50;
    const maxLoopTime = 10;
    let resetTimeout: any = null;

    function showAvatar() {
      document.body.classList.remove("avatar-hidden");
      document.body.classList.add("avatar-visible");
      setIsVisible(true);
    }

    function hideAvatar() {
      document.body.classList.remove("avatar-visible");
      document.body.classList.add("avatar-hidden");
      setIsVisible(false);
    }

    // Delegate click event to reveal avatar ONLY when the widget's call button is clicked
    const handleWidgetClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const root = document.getElementById("root");
      if (root && root.contains(target)) return;

      let el: HTMLElement | null = target;
      while (el && el !== document.body) {
        const cls = el.className && typeof el.className === "string" ? el.className : "";
        const id = el.id ? el.id : "";
        if (
          cls.indexOf("bcw") !== -1 ||
          cls.indexOf("fab") !== -1 ||
          cls.indexOf("widget-call") !== -1 ||
          cls.indexOf("widget-connect") !== -1 ||
          cls.indexOf("chat-widget") !== -1 ||
          id.indexOf("bcw") !== -1 ||
          id.indexOf("widget") !== -1
        ) {
          showAvatar();
          break;
        }
        el = el.parentElement;
      }
    };
    document.addEventListener("click", handleWidgetClick, true);

    function clearResetTimeout() {
      if (resetTimeout) {
        clearTimeout(resetTimeout);
        resetTimeout = null;
      }
    }

    function stopAnimations() {
      if (animationTimeout) {
        clearTimeout(animationTimeout);
        animationTimeout = null;
      }
      clearResetTimeout();
    }

    function triggerRandomAnimation() {
      if (connectedState) return;
      clearResetTimeout();

      if ((window as any).WebAvatar && typeof (window as any).WebAvatar.loadAnimation === "function") {
        const anim = AVATAR_ANIMATIONS[Math.floor(Math.random() * AVATAR_ANIMATIONS.length)];
        (window as any).WebAvatar.loadAnimation(anim);
        (window as any).WebAvatar.setEmotion("happy", 10);

        if (anim.toLowerCase().indexOf("loop") !== -1) {
          resetTimeout = setTimeout(() => {
            if (connectedState) return;
            const resetAnim = ANIMATION_RESET[Math.floor(Math.random() * ANIMATION_RESET.length)];
            (window as any).WebAvatar.loadAnimation(resetAnim);
            (window as any).WebAvatar.setEmotion("idle", 10);
          }, maxLoopTime * 1000);
        }
      }
      scheduleNext();
    }

    function scheduleNext() {
      if (animationTimeout) clearTimeout(animationTimeout);
      const nextInterval = (minInterval + Math.random() * (maxInterval - minInterval)) * 1000;
      animationTimeout = setTimeout(triggerRandomAnimation, nextInterval);
    }

    function startAnimations() {
      scheduleNext();
    }

    const handleAvatarReady = () => {
      if (!connectedState) {
        hideAvatar();
        startAnimations();
      } else {
        showAvatar();
      }
    };

    const handleConnect = () => {
      connectedState = true;
      setIsConnected(true);
      showAvatar();
      stopAnimations();
    };

    const handleDisconnect = () => {
      connectedState = false;
      setIsConnected(false);
      hideAvatar();
      startAnimations();
    };

    window.addEventListener("avatar-widget-ready", handleAvatarReady);
    window.addEventListener("onConnect", handleConnect);
    window.addEventListener("onDisconnect", handleDisconnect);

    const handleNavigate = (e: any) => {
      e.preventDefault();
      const target = e.detail?.target;
      if (target) {
        navigate({ to: target });
      }
    };

    window.addEventListener("webavatar-navigate", handleNavigate);

    return () => {
      document.body.classList.remove("avatar-hidden", "avatar-visible");
      document.removeEventListener("click", handleWidgetClick, true);
      window.removeEventListener("avatar-widget-ready", handleAvatarReady);
      window.removeEventListener("onConnect", handleConnect);
      window.removeEventListener("onDisconnect", handleDisconnect);
      window.removeEventListener("webavatar-navigate", handleNavigate);
      stopAnimations();

      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
      const existingScript = document.getElementById("webavatar-jssdk");
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
      if ((window as any).WebAvatar) {
        try {
          (window as any).WebAvatar.disconnect();
        } catch (err) {
          console.error("Error disconnecting WebAvatar on unmount:", err);
        }
      }
      delete (window as any).ChatWidgetConfig;
    };
  }, [navigate]);

  return { isConnected, isVisible };
}

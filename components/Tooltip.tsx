"use client";

import React, { useState, useRef } from "react";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
  const [show, setShow] = useState(false);
  const timeout = useRef<NodeJS.Timeout>();

  const enter = () => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setShow(true), 300);
  };
  const leave = () => {
    clearTimeout(timeout.current);
    setShow(false);
  };

  return (
    <span
      className="tooltip-wrapper"
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
      tabIndex={0}
    >
      {children}
      {show && <span className="tooltip-bubble">{text}</span>}
    </span>
  );
}

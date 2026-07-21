"use client";

import {
  useState,
  type CSSProperties,
  type ReactNode,
  type InputHTMLAttributes,
} from "react";

/** Div dengan gaya hover (inline style tidak mendukung :hover). */
export function HoverBox({
  style,
  hoverStyle,
  children,
  onClick,
  title,
  as = "div",
  disabled,
}: {
  style: CSSProperties;
  hoverStyle?: CSSProperties;
  children?: ReactNode;
  onClick?: () => void;
  title?: string;
  as?: "div" | "button";
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const merged =
    hover && hoverStyle && !disabled ? { ...style, ...hoverStyle } : style;
  if (as === "button") {
    return (
      <button
        type="button"
        title={title}
        disabled={disabled}
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={merged}
      >
        {children}
      </button>
    );
  }
  return (
    <div
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={merged}
    >
      {children}
    </div>
  );
}

/** Input teks dengan focus-ring hijau. */
export function TextInput({
  style,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { style?: CSSProperties }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      {...props}
      onFocus={(e) => {
        setFocus(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        props.onBlur?.(e);
      }}
      style={{
        outline: "none",
        ...style,
        ...(focus
          ? {
              border: "1.5px solid #1B8A43",
              boxShadow: "0 0 0 3px rgba(27,138,67,.12)",
            }
          : {}),
      }}
    />
  );
}

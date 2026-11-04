// Vector recreation of the depa folded-paper mark for crisp responsive rendering.
export default function DepaMark({ size = 120, className, ...props }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size * (905 / 587)}
      viewBox="0 0 587 905"
      fill="none"
      focusable="false"
      {...props}
    >
      <path d="M29 29 409 410 255 568 29 29Z" fill="#FFC600" />
      <path d="m255 568 248-302 64 302H255Z" fill="#FFF200" />
      <path d="M84 904 567 568H255L84 904Z" fill="#FFF200" />
      <path d="M255 568h312L255 644v-76Z" fill="#E3C900" />
    </svg>
  );
}

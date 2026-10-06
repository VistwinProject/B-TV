// Keep the final two Chinese characters and closing punctuation on one line.
// The browser moves the preceding character down instead of leaving a lone glyph.
export default function CaptionText({ text }) {
  const tail = text.match(/\p{Script=Han}{2}[\p{Punctuation}\p{White_Space}]*$/u)
  if (!tail) return text
  return <>{text.slice(0, tail.index)}<span className="caption-tail">{tail[0]}</span></>
}

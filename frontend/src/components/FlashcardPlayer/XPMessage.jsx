// XPMessage.jsx
// XP popup or style message

export default function XPMessage({ message, show }) {
  if (!show) return null;
  return <div className="xp-message">{message}</div>;
}
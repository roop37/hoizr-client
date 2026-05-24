type Props = {
  lines: string[];
};

export const HTicker = ({ lines }: Props) => {
  const doubled = [...lines, ...lines];
  return (
    <div className="h-ticker" aria-hidden>
      <div className="h-ticker-track">
        {doubled.map((t, i) => (
          <span key={i}>
            <span className="dot">●</span>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};

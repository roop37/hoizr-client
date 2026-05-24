import Link from "next/link";
import { HICONS } from "./icons";

type Props = {
  title: string;
  seeAllHref?: string;
};

export const RailHead = ({ title, seeAllHref }: Props) => {
  if (seeAllHref) {
    return (
      <div className="h-rail-head">
        <Link href={seeAllHref} style={{ display: "inline-flex", alignItems: "center" }}>
          <h2>
            <span>{title}</span>
            <span className="chev">{HICONS.chevR}</span>
          </h2>
        </Link>
      </div>
    );
  }
  return (
    <div className="h-rail-head">
      <h2>
        <span>{title}</span>
      </h2>
    </div>
  );
};

import Link from "next/link";

export type CollectionStyle =
  | "heavy-rotation"
  | "energy"
  | "dance-workout"
  | "india-debuts"
  | "weekend-hits";

export type CollectionDef = {
  id: string;
  kind: string;
  title: string;
  sub: string;
  style: CollectionStyle;
};

type Props = {
  collection: CollectionDef;
  href?: string;
};

export const CollectionCard = ({ collection, href = "/events" }: Props) => {
  const words = collection.title.split(" ");
  const first = words.slice(0, 1).join(" ");
  const rest = words.slice(1).join(" ");
  return (
    <Link href={href} className={`h-col h-col-${collection.style}`}>
      <div className="art" />
      <div className="head">
        <div className="h-title">{first}</div>
        {rest ? <div className="h-title">{rest}</div> : null}
      </div>
      <div className="desc">
        <div className="kind">{collection.kind}</div>
        <div className="nm">{collection.title}</div>
        <div className="sub">{collection.sub}</div>
      </div>
    </Link>
  );
};

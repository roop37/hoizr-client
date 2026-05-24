import Image, { type ImageProps } from "next/image";
import { getBlur } from "@/lib/blur-manifest";

/**
 * next/image wrapper that auto-applies the build-time blurhash LQIP
 * for local images. Falls back to no placeholder if the manifest
 * doesn't have an entry (e.g. dynamic remote URLs from the CDN).
 *
 * Use `priority` for above-the-fold images, `sizes` for responsive
 * widths. All other next/image props pass through.
 */
type BlurImageProps = Omit<ImageProps, "placeholder" | "blurDataURL"> & {
  blurDataURL?: string;
};

export const BlurImage = ({ src, width, height, blurDataURL, fill, ...rest }: BlurImageProps) => {
  const srcStr = typeof src === "string" ? src : undefined;
  const entry = srcStr ? getBlur(srcStr) : null;
  const resolved = blurDataURL ?? entry?.dataURL;

  const dimensions = fill
    ? {}
    : { width: width ?? entry?.width, height: height ?? entry?.height };

  if (!resolved) {
    return <Image src={src} fill={fill} {...dimensions} {...rest} />;
  }
  return (
    <Image
      src={src}
      fill={fill}
      {...dimensions}
      placeholder="blur"
      blurDataURL={resolved}
      {...rest}
    />
  );
};

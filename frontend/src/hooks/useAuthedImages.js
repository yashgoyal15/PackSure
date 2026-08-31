import { useEffect, useState } from "react";
import { fetchAuthedBlobUrl } from "../api/client";
import { imagePath } from "../api/inspections";

/**
 * Given the raw `images` array from an InspectionDetail API response
 * (each with an `id`), returns [{ id, url }] where `url` is a local blob
 * URL suitable for <img src>. Needed because the image endpoint requires
 * an Authorization header, which plain <img> tags can't send.
 */
export function useAuthedImages(rawImages) {
  const [urls, setUrls] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const objectUrls = [];

    async function load() {
      if (!rawImages || rawImages.length === 0) {
        setUrls([]);
        return;
      }
      const results = await Promise.all(
        rawImages.map(async (img) => {
          try {
            const url = await fetchAuthedBlobUrl(imagePath(img.id));
            objectUrls.push(url);
            return { id: img.id, url };
          } catch {
            return { id: img.id, url: null };
          }
        })
      );
      if (!cancelled) setUrls(results);
    }

    load();
    return () => {
      cancelled = true;
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(rawImages?.map((i) => i.id))]);

  return urls;
}

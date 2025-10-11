import { Children, ReactElement, ReactNode, useEffect, useRef } from "react";

interface HelmetProps {
  children: ReactNode;
}

export function Helmet({ children }: HelmetProps) {
  const prevTitleRef = useRef<string | null>(null);

  useEffect(() => {
    const elements = Children.toArray(children) as ReactElement[];
    const createdMeta: HTMLMetaElement[] = [];
    const updatedMeta: Array<{ element: HTMLMetaElement; previousContent: string }>
      = [];

    elements.forEach((element) => {
      if (element.type === "title") {
        if (prevTitleRef.current === null) {
          prevTitleRef.current = document.title;
        }
        const nextTitle = typeof element.props.children === "string"
          ? element.props.children
          : Array.isArray(element.props.children)
            ? element.props.children.join("")
            : String(element.props.children ?? "");
        document.title = nextTitle;
      }

      if (element.type === "meta") {
        const name = element.props.name as string | undefined;
        const content = element.props.content as string | undefined;
        if (!name || typeof content !== "string") {
          return;
        }

        const existing = document.head.querySelector(
          `meta[name="${name}"]`,
        ) as HTMLMetaElement | null;

        if (existing) {
          updatedMeta.push({ element: existing, previousContent: existing.content });
          existing.content = content;
        } else {
          const meta = document.createElement("meta");
          meta.name = name;
          meta.content = content;
          document.head.appendChild(meta);
          createdMeta.push(meta);
        }
      }
    });

    return () => {
      createdMeta.forEach((meta) => {
        if (meta.parentElement === document.head) {
          document.head.removeChild(meta);
        }
      });

      updatedMeta.forEach(({ element, previousContent }) => {
        element.content = previousContent;
      });

      if (prevTitleRef.current !== null) {
        document.title = prevTitleRef.current;
        prevTitleRef.current = null;
      }
    };
  }, [children]);

  return null;
}

export default Helmet;

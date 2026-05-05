"use client";

import NextLink from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
  useParams as useNextParams,
} from "next/navigation";
import { useEffect } from "react";

export const useNavigate = () => {
  const router = useRouter();
  return (to: string) => {
    if (!to) return;
    router.push(to);
  };
};

export const useParams = () => {
  return useNextParams() || {};
};

export const useLocation = () => {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  const search = searchParams?.toString() || "";

  return {
    pathname,
    search: search ? `?${search}` : "",
  };
};

export const useSearchParams = () => {
  const params = useNextSearchParams() || new URLSearchParams();
  const setParams = () => {};
  return [params, setParams] as const;
};

export const Navigate = ({ to }: { to: string }) => {
  const router = useRouter();
  useEffect(() => {
    if (to) router.replace(to);
  }, [to, router]);
  return null;
};

export const Link = ({ to, href, children, ...props }: any) => {
  const finalHref = href || to || "#";
  return (
    <NextLink href={finalHref} {...props}>
      {children}
    </NextLink>
  );
};

export const NavLink = Link;

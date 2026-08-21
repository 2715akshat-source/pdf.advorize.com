import TransitionLink from "@/components/TransitionLink";
import Magnetic from "@/components/Magnetic";

export default function NotFound() {
  return (
    <section className="shell flex min-h-screen flex-col justify-center py-32">
      <h1 className="display max-w-[12ch] text-[13vw] leading-[0.95] md:text-[8vw]">
        No tool lives here
      </h1>
      <p className="mt-10 max-w-[52ch] text-lg text-muted md:text-xl">
        The page you were after does not exist. Everything we have is on the home
        page, grouped by what it does.
      </p>
      <Magnetic className="mt-14 w-fit">
        <TransitionLink
          href="/"
          data-cursor="hover"
          className="inline-flex h-32 w-32 items-center justify-center rounded-full bg-accent text-center text-sm font-medium text-white md:h-40 md:w-40"
        >
          See all
          <br />
          tools
        </TransitionLink>
      </Magnetic>
    </section>
  );
}

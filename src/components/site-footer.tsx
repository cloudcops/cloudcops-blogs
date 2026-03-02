import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#02040a] pt-16 pb-8">
      <div className="mx-auto w-full max-w-[1180px] px-4 md:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-8">
          
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/images/cloudcops_logo.png"
                alt="CloudCops"
                width={156}
                height={36}
                className="h-8 w-auto opacity-90 transition-opacity hover:opacity-100"
              />
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">
              Empowering startups and enterprises with scalable, secure, and modern DevOps workflows in the era of AI.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Services</h3>
            <ul className="space-y-3">
              <li>
                <a href="https://cloudcops.com/en/tech-co-founder-program" className="text-sm text-muted-foreground transition-colors hover:text-primary" target="_blank" rel="noreferrer">Tech Co-Founder Program</a>
              </li>
              <li>
                <a href="https://cloudcops.com/en" className="text-sm text-muted-foreground transition-colors hover:text-primary" target="_blank" rel="noreferrer">Cloud Infrastructure</a>
              </li>
              <li>
                <a href="https://cloudcops.com/en" className="text-sm text-muted-foreground transition-colors hover:text-primary" target="_blank" rel="noreferrer">Security &amp; Compliance</a>
              </li>
              <li>
                <a href="https://cloudcops.com/en" className="text-sm text-muted-foreground transition-colors hover:text-primary" target="_blank" rel="noreferrer">Kubernetes Management</a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="https://cloudcops.com/en/about-us" className="text-sm text-muted-foreground transition-colors hover:text-primary" target="_blank" rel="noreferrer">About Us</a>
              </li>
              <li>
                <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">Blog &amp; Resources</Link>
              </li>
              <li>
                <a href="https://calendly.com/salih-kayiplar" className="text-sm text-muted-foreground transition-colors hover:text-primary" target="_blank" rel="noreferrer">Contact Us</a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Legal</h3>
            <ul className="space-y-3">
              <li>
                <a href="https://cloudcops.com/en/imprint" className="text-sm text-muted-foreground transition-colors hover:text-primary" target="_blank" rel="noreferrer">Imprint</a>
              </li>
              <li>
                <a href="https://cloudcops.com/en/privacy-policy" className="text-sm text-muted-foreground transition-colors hover:text-primary" target="_blank" rel="noreferrer">Privacy Policy</a>
              </li>
              <li>
                <a href="https://cloudcops.com/en/terms-conditions" className="text-sm text-muted-foreground transition-colors hover:text-primary" target="_blank" rel="noreferrer">Terms &amp; Conditions</a>
              </li>
            </ul>
        </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between border-t border-white/10 pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} CloudCops GmbH. All rights reserved.
          </p>
          <div className="mt-4 flex space-x-4 md:mt-0">
            <a href="https://www.linkedin.com/company/cloudcops/" className="text-muted-foreground hover:text-primary" target="_blank" rel="noreferrer">
              <span className="sr-only">LinkedIn</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a href="https://github.com/cloudcops" className="text-muted-foreground hover:text-primary" target="_blank" rel="noreferrer">
              <span className="sr-only">GitHub</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

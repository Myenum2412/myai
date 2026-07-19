import { RiGithubFill, RiTwitterXFill, RiDiscordFill } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const columns = [
  { title: "Product", links: ["Blocks", "Templates", "Pricing", "Changelog"] },
  { title: "Resources", links: ["Docs", "Guides", "Support", "API"] },
  { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
]

const socials = [
  { label: "GitHub", icon: RiGithubFill },
  { label: "X", icon: RiTwitterXFill },
  { label: "Discord", icon: RiDiscordFill },
]

export default function FooterBlock() {
  return (
    <section className="flex min-h-svh w-full flex-col justify-center bg-background text-foreground">
      <Separator />
      <footer className="w-full px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="max-w-sm">
            <a href="#" className="flex items-center gap-2">
              <div className="grid grid-cols-2 gap-0.5" aria-hidden="true">
                <div className="size-2.5 bg-primary" />
                <div className="size-2.5 bg-primary" />
                <div className="size-2.5 bg-primary" />
                <div className="size-2.5 bg-primary" />
              </div>
              <span className="text-lg font-bold tracking-tight">Acme</span>
            </a>
            <p className="mt-3 text-sm text-muted-foreground">
              Everything your team needs to build, ship, and scale.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-bold tracking-tight">
                  {col.title}
                </h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <Separator className="mt-10" />
        <div className="flex flex-col items-start gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; 2026 Acme. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {socials.map((social) => (
              <Button
                key={social.label}
                variant="outline"
                size="icon-sm"
                aria-label={social.label}
                render={<a href="#" />}
                nativeButton={false}
                className="rounded-none text-muted-foreground hover:text-foreground"
              >
                <social.icon className="size-4" aria-hidden="true" />
              </Button>
            ))}
          </div>
        </div>
      </footer>
      <Separator />
    </section>
  )
}

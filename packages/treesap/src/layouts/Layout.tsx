interface BaseLayoutProps {
  title?: string;
  description?: string;
  head?: any;
  children: any;
}

export default function BaseLayout(props: BaseLayoutProps) {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: '<!DOCTYPE html>' }} />
      <html lang="en">
      <head>
        <title>{props.title || "Treesap"}</title>
        <meta name="description" content={props.description || "A modern web application"} />
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
        <link rel="stylesheet" href="/styles/main.css" />
        {/* Sapling Islands */}
        <script type="module" src="https://sapling-is.land"></script>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              sapling-island{display:contents}
            `,
          }}
        />
        <script
          src="https://cdn.jsdelivr.net/npm/iconify-icon@2.1.0/dist/iconify-icon.min.js"
          defer
        >
        </script>
        {props.head}
      </head>
      <body class="bg-white text-black">
        {props.children}
      </body>
      </html>
    </>
  );
}

import React from "react";
import { Card, CardHeader, CardTitle } from "../..//ui/card.tsx";
import type { CmsNavData } from "@treesap/treesap";

export default function HomeContent({ navData }: { navData: CmsNavData[] }) {
  return (
    <div className="p-8 flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold">Collections</h2>
        <ul className="py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {navData
            .filter((item) => item.type === "collection")
            .map((item) => (
              <li key={item.slug}>
                <a href={`/admin/collections/${item.slug}`}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-center">
                        {item.label}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </a>
              </li>
            ))}
        </ul>
      </div>
      <div>
        <h2 className="text-2xl font-bold">Globals</h2>
        <ul className="py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {navData
            .filter((item) => item.type === "global")
            .map((item) => (
              <li>
                <a href={`/admin/globals/${item.slug}`}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-center">
                        {item.label}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </a>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

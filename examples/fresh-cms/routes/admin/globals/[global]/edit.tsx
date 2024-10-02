import { Handlers, PageProps } from "$fresh/server.ts";
import { treesap } from '../../../../utils/treesap.ts'

export const handler: Handlers = {
  async GET(req, ctx) {       
    const { global } = ctx.params;
    const globalData = await treesap.getGlobal(global);
    
    return ctx.render({ globalData });
  }
};

export default function Projects(props: PageProps) {
  const { globalData } = props.data;

  return (
    <div>
      
    </div>
  );
}

export const GET = async (
  req: Request,
  params: Promise<{ workspaceId: string }>
) => {
  const { workspaceId } = await params;
};

export const PATCH = async (
  req: Request,
  params: Promise<{ workspaceId: string }>
) => {
  const { workspaceId } = await params;
};

export const DELETE = async (
  req: Request,
  params: Promise<{ workspaceId: string }>
) => {
  const { workspaceId } = await params;
};

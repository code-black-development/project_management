import { Meta, StoryObj } from "@storybook/react";
import WorkspaceForm from "./create-workspace-form";
import {} from "@prisma/client";
import { within, waitFor } from "@storybook/testing-library";
import { expect } from "@storybook/test";

const meta: Meta<typeof WorkspaceForm> = {
  title: "Components/WorkspaceForm",
  component: WorkspaceForm,
  args: {},
};
export default meta;

type Story = StoryObj<typeof meta>;

//form should display with the correct form inputs
export const EmptyForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const name = canvas.getByRole("textbox", { name: /name/i });
    //const image = canvas.getByRole("textbox", { name: /image/i });

    await expect(name).toBeInTheDocument();
    //await expect(image).toBeInTheDocument();
  },
};

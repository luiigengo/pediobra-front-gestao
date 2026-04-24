import { render, screen } from "@testing-library/react";
import { ImageFilePreview } from "./image-file-preview";

describe("ImageFilePreview", () => {
  const createObjectURL = jest.fn((file: File) => `blob:${file.name}`);
  const revokeObjectURL = jest.fn();

  beforeEach(() => {
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });

  it("renders a local object URL as soon as a file is selected", () => {
    const file = new File(["image"], "logo.png", { type: "image/png" });

    render(<ImageFilePreview file={file} alt="Logo preview" />);

    expect(screen.getByRole("img", { name: "Logo preview" })).toHaveAttribute(
      "src",
      "blob:logo.png",
    );
  });

  it("revokes local object URLs when the preview changes", () => {
    const first = new File(["first"], "first.png", { type: "image/png" });
    const second = new File(["second"], "second.png", { type: "image/png" });
    const { rerender, unmount } = render(
      <ImageFilePreview file={first} alt="Preview" />,
    );

    rerender(<ImageFilePreview file={second} alt="Preview" />);

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:first.png");

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:second.png");
  });
});

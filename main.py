import tkinter as tk
from tkinter import filedialog, simpledialog, messagebox
from PIL import Image, ImageDraw, ImageTk
import json

# Global variables to track key coordinates and labels
KEY_COORDINATES = {}
CHARACTERS = []
BASE_IMAGE = None
highlighted_marker = None  # Track the currently highlighted marker


def define_keyboard_layout():
    """Allow the user to define the keyboard layout by dragging markers to keys."""
    global BASE_IMAGE, KEY_COORDINATES, CHARACTERS

    # Load the blank keyboard template
    filepath = filedialog.askopenfilename(filetypes=[("PNG Images", "*.png"), ("All Files", "*.*")])
    if not filepath:
        return
    BASE_IMAGE = Image.open(filepath)

    # Tkinter window to display the template and interactive markers
    root = tk.Toplevel()
    root.title("Define Keyboard Layout")
    root.geometry(f"{BASE_IMAGE.width}x{BASE_IMAGE.height}")

    # Tkinter Canvas to display the keyboard image
    canvas = tk.Canvas(root, width=BASE_IMAGE.width, height=BASE_IMAGE.height)
    canvas.pack()
    img = ImageTk.PhotoImage(BASE_IMAGE)
    canvas.create_image(0, 0, anchor="nw", image=img)

    # Store marker data
    markers = []

    def add_marker(event):
        """Add a new draggable marker at the clicked position."""
        x, y = event.x, event.y
        label = simpledialog.askstring("Label Key", "Enter key label:")
        if label:
            # Save marker and label
            KEY_COORDINATES[label] = (x, y)
            CHARACTERS.append(label)
            marker = canvas.create_oval(x - 5, y - 5, x + 5, y + 5, fill="red", tags="marker")
            text = canvas.create_text(x, y - 10, text=label, fill="black", tags="marker")
            markers.append((marker, text))

    def start_drag(event):
        """Start dragging a marker."""
        global highlighted_marker
        closest = canvas.find_closest(event.x, event.y)[0]
        if "marker" in canvas.gettags(closest):
            highlighted_marker = closest  # Set the currently highlighted marker
            canvas.tag_bind(closest, "<B1-Motion>", drag_marker)

    def drag_marker(event):
        """Drag a marker and update its coordinates."""
        global highlighted_marker
        if highlighted_marker:
            x, y = event.x, event.y
            # Update marker position
            canvas.coords(highlighted_marker, x - 5, y - 5, x + 5, y + 5)
            # Find the corresponding label
            for label, coords in KEY_COORDINATES.items():
                if coords == canvas.coords(highlighted_marker)[:2]:
                    KEY_COORDINATES[label] = (x, y)
                    break
            # Update live coordinates display
            if "coord_display" in canvas.gettags("coord_display"):
                canvas.delete("coord_display")
            canvas.create_text(x + 20, y, text=f"({x}, {y})", fill="blue", tags="coord_display")

    def highlight_marker(event):
        """Highlight a marker when clicked."""
        global highlighted_marker
        x, y = event.x, event.y
        closest = canvas.find_closest(x, y)[0]
        if "marker" in canvas.gettags(closest):
            highlighted_marker = closest
            canvas.itemconfig(highlighted_marker, outline="blue", width=2)

    def delete_marker():
        """Delete the highlighted marker."""
        global highlighted_marker
        if highlighted_marker:
            # Find the label associated with the highlighted marker
            for label, coords in list(KEY_COORDINATES.items()):
                marker_coords = canvas.coords(highlighted_marker)
                if coords == (marker_coords[0] + 5, marker_coords[1] + 5):
                    del KEY_COORDINATES[label]
                    CHARACTERS.remove(label)
                    break
            canvas.delete(highlighted_marker)
            highlighted_marker = None

    # Bind left-click to add a marker, and double-click to highlight a marker
    canvas.bind("<Button-1>", add_marker)
    canvas.bind("<Double-Button-1>", highlight_marker)

    # Button to delete a highlighted marker
    tk.Button(root, text="Delete Highlighted Marker", command=delete_marker).pack()

    def finish():
        """Finish defining the keyboard layout and close the window."""
        if not KEY_COORDINATES:
            messagebox.showerror("Error", "You must define at least one key!")
        else:
            root.destroy()

    tk.Button(root, text="Finish", command=finish).pack()


def save_layout_to_file():
    """Save the key coordinates and labels to a JSON file."""
    if not KEY_COORDINATES:
        messagebox.showerror("Error", "No key coordinates defined!")
        return

    data = {"coordinates": KEY_COORDINATES, "characters": CHARACTERS}
    with open("keyboard_layout.json", "w") as f:
        json.dump(data, f, indent=4)
    messagebox.showinfo("Success", "Keyboard layout saved to 'keyboard_layout.json'.")


def load_layout_from_file():
    """Load key coordinates and labels from a JSON file, and visualize the layout."""
    global BASE_IMAGE, KEY_COORDINATES, CHARACTERS

    filepath = filedialog.askopenfilename(filetypes=[("JSON Files", "*.json"), ("All Files", "*.*")])
    if not filepath:
        return

    with open(filepath, "r") as f:
        data = json.load(f)

    KEY_COORDINATES = data["coordinates"]
    CHARACTERS = data["characters"]

    if not BASE_IMAGE:
        messagebox.showerror("Error", "Please upload a keyboard template first!")
        return

    # Display the loaded layout on the keyboard
    root = tk.Toplevel()
    root.title("Loaded Keyboard Layout")
    root.geometry(f"{BASE_IMAGE.width}x{BASE_IMAGE.height}")

    canvas = tk.Canvas(root, width=BASE_IMAGE.width, height=BASE_IMAGE.height)
    canvas.pack()
    img = ImageTk.PhotoImage(BASE_IMAGE)
    canvas.create_image(0, 0, anchor="nw", image=img)

    for label, (x, y) in KEY_COORDINATES.items():
        canvas.create_oval(x - 5, y - 5, x + 5, y + 5, fill="red")
        canvas.create_text(x, y - 10, text=label, fill="black")

    def save_as_image():
        """Save the loaded layout as an image file."""
        output_path = filedialog.asksaveasfilename(defaultextension=".png", filetypes=[("PNG Images", "*.png")])
        if output_path:
            layout_img = BASE_IMAGE.copy()
            draw = ImageDraw.Draw(layout_img)
            for label, (x, y) in KEY_COORDINATES.items():
                draw.ellipse((x - 5, y - 5, x + 5, y + 5), fill="red")
                draw.text((x, y - 10), label, fill="black")
            layout_img.save(output_path)
            messagebox.showinfo("Success", f"Layout saved as {output_path}.")

    tk.Button(root, text="Save as Image", command=save_as_image).pack()


def main():
    """Main GUI for setting up the keyboard layout."""
    root = tk.Tk()
    root.title("Keyboard Layout Setup")
    root.geometry("300x200")

    tk.Button(root, text="Upload Keyboard Template", command=define_keyboard_layout).pack(pady=10)
    tk.Button(root, text="Save Layout", command=save_layout_to_file).pack(pady=10)
    tk.Button(root, text="Load Layout", command=load_layout_from_file).pack(pady=10)

    root.mainloop()


if __name__ == "__main__":
    main()

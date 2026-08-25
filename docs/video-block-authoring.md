# Video Block — Authoring Guide

The Video block plays a single video from either **YouTube** or the **AEM DAM /
Dynamic Media**, with an optional poster (placeholder) image and play button.

## Adding the block

1. Open the page in the Universal Editor.
2. In the section where you want the video, click the **+** (Insert) control and
   choose **Video**.
3. Select the newly added Video block to open its **properties** panel.

Before you set a source, the block shows a neutral **grey placeholder box** so
you can see where the video will sit.

## Fields

### 1. Video Source *(required)*

This single field accepts **either** source — the block auto-detects which one
you used:

- **YouTube** — paste the full URL, e.g.
  - `https://www.youtube.com/watch?v=XXXX`, or
  - `https://youtu.be/XXXX`
- **DAM / Dynamic Media video** — click the picker and select a video asset. The
  picker opens at **`/content/dam/upsstories`**.
  - A DAM video published to Dynamic Media plays through the **Scene7 video
    viewer**.
  - A plain video file plays in a standard HTML5 player.

### 2. Enable Placeholder Image *(optional, off by default)*

A checkbox. When you **turn it on**, two more fields appear:

- **Placeholder Image** — pick a poster image from the DAM. The video shows this
  image with a **play button** overlaid, and only loads when the visitor clicks
  it (better for page performance).
- **Placeholder Alt Text** — accessible alt text describing the poster image.

When the checkbox is **off**, no poster is shown and the video loads on its own —
even if you had picked an image earlier, it is ignored.

## Behavior notes

- **With a placeholder image:** the visitor sees the poster + play button;
  clicking it loads and plays the video.
- **Without a placeholder image:** the video loads automatically when it scrolls
  into view.
- The play button matches the **Dynamic Media viewer** style (a large
  semi-transparent dark circle with a white triangle).

## Where it renders

- The **Dynamic Media (Scene7) viewer** appears on the **published page** (and in
  the Universal Editor author view) — not in the plain local preview.
- YouTube and standard video files render everywhere.

## Quick recipes

| Goal | Steps |
|------|-------|
| YouTube video, plays on scroll | Paste the YouTube URL in **Video Source**. Leave the placeholder off. |
| YouTube with a custom poster | Paste the URL → enable **Placeholder Image** → pick an image + add alt text. |
| DAM / Dynamic Media video | Pick the asset in **Video Source** (opens at `/content/dam/upsstories`). |
| DAM video with poster | Pick the asset → enable **Placeholder Image** → pick an image + alt text. |

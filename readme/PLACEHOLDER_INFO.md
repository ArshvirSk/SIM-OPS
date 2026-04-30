# Placeholder Images

The README currently references these screenshot files. Please replace them with actual screenshots following the `SCREENSHOT_GUIDE.md`.

## Current Status

All images are currently placeholders. To complete the documentation:

1. Follow the instructions in `SCREENSHOT_GUIDE.md`
2. Take screenshots of each section
3. Save them in this `readme/` folder with the exact names listed below
4. Commit and push the images to your repository

## Required Files

```
readme/
├── banner.png                    # [PLACEHOLDER] - Create banner image
├── dashboard.png                 # [PLACEHOLDER] - Screenshot of main dashboard
├── customer-detail.png           # [PLACEHOLDER] - Screenshot of customer detail page
├── customer-actions.png          # [PLACEHOLDER] - Screenshot of action plan modal
├── agents.png                    # [PLACEHOLDER] - Screenshot of agents page
├── agent-communication.png       # [PLACEHOLDER] - Screenshot of agent communication
├── predictions.png               # [PLACEHOLDER] - Screenshot of predictions page
├── ml-training.png               # [PLACEHOLDER] - Screenshot of ML training page
├── alerts.png                    # [PLACEHOLDER] - Screenshot of alerts page
├── incidents.png                 # [PLACEHOLDER] - Screenshot of incidents page
├── scheduler-terminal.png        # [PLACEHOLDER] - Terminal screenshot
├── ml-service-terminal.png       # [PLACEHOLDER] - Terminal screenshot
├── architecture-diagram.png      # [PLACEHOLDER] - Architecture diagram
└── mobile-responsive.png         # [PLACEHOLDER] - Mobile view screenshot
```

## Quick Start

To quickly generate placeholder images for testing:

```bash
# Create simple placeholder images (requires ImageMagick)
cd readme

# Banner
convert -size 1200x300 -background "#0ea5e9" -fill white -gravity center \
  -pointsize 72 label:"SIM-OPS" banner.png

# Dashboard
convert -size 1920x1080 -background "#f3f4f6" -fill "#1f2937" -gravity center \
  -pointsize 48 label:"Dashboard Screenshot\n\nPlease replace with actual screenshot" \
  dashboard.png

# Repeat for other images...
```

Or use online placeholder services temporarily:
- https://placehold.co
- https://via.placeholder.com
- https://dummyimage.com

## After Adding Screenshots

Once you've added all screenshots:

1. Delete this `PLACEHOLDER_INFO.md` file
2. Update the README if needed
3. Commit your changes:

```bash
git add readme/*.png
git commit -m "docs: add project screenshots"
git push
```

## Preview

To preview how the README looks with your screenshots:

1. Push to GitHub
2. View the repository README
3. Check that all images load correctly
4. Adjust image sizes if needed

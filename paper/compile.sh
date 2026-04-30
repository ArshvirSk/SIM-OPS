#!/bin/bash
# Shell script to compile the IEEE paper on Linux/Mac

echo "========================================"
echo "Compiling SIM-OPS IEEE Paper"
echo "========================================"
echo ""

# Check if pdflatex is available
if ! command -v pdflatex &> /dev/null; then
    echo "ERROR: pdflatex not found!"
    echo "Please install TeX Live:"
    echo ""
    echo "Ubuntu/Debian:"
    echo "  sudo apt-get install texlive-full"
    echo ""
    echo "macOS:"
    echo "  brew install --cask mactex"
    echo ""
    echo "Fedora/RHEL:"
    echo "  sudo yum install texlive-scheme-full"
    exit 1
fi

# First pass
echo "Step 1/4: First pdflatex pass..."
pdflatex -interaction=nonstopmode simops_ieee_paper.tex
if [ $? -ne 0 ]; then
    echo "ERROR: First pdflatex pass failed!"
    exit 1
fi

# Process bibliography
echo ""
echo "Step 2/4: Processing bibliography..."
bibtex simops_ieee_paper
if [ $? -ne 0 ]; then
    echo "WARNING: BibTeX processing had issues, continuing..."
fi

# Second pass
echo ""
echo "Step 3/4: Second pdflatex pass..."
pdflatex -interaction=nonstopmode simops_ieee_paper.tex
if [ $? -ne 0 ]; then
    echo "ERROR: Second pdflatex pass failed!"
    exit 1
fi

# Final pass
echo ""
echo "Step 4/4: Final pdflatex pass..."
pdflatex -interaction=nonstopmode simops_ieee_paper.tex
if [ $? -ne 0 ]; then
    echo "ERROR: Final pdflatex pass failed!"
    exit 1
fi

echo ""
echo "========================================"
echo "Compilation successful!"
echo "========================================"
echo ""
echo "Output file: simops_ieee_paper.pdf"
echo ""

# Clean up auxiliary files (optional)
echo "Cleaning up auxiliary files..."
rm -f simops_ieee_paper.aux
rm -f simops_ieee_paper.log
rm -f simops_ieee_paper.out
rm -f simops_ieee_paper.bbl
rm -f simops_ieee_paper.blg

echo ""
echo "Done! Opening PDF..."

# Open PDF based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open simops_ieee_paper.pdf
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open simops_ieee_paper.pdf 2>/dev/null || echo "Please open simops_ieee_paper.pdf manually"
fi

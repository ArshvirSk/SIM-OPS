@echo off
REM Batch script to compile the IEEE paper on Windows

echo ========================================
echo Compiling SIM-OPS IEEE Paper
echo ========================================
echo.

REM Check if pdflatex is available
where pdflatex >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: pdflatex not found!
    echo Please install MiKTeX or TeX Live.
    echo.
    echo Download from:
    echo   MiKTeX: https://miktex.org/download
    echo   TeX Live: https://www.tug.org/texlive/
    pause
    exit /b 1
)

echo Step 1/4: First pdflatex pass...
pdflatex -interaction=nonstopmode simops_ieee_paper.tex
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: First pdflatex pass failed!
    pause
    exit /b 1
)

echo.
echo Step 2/4: Processing bibliography...
bibtex simops_ieee_paper
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: BibTeX processing had issues, continuing...
)

echo.
echo Step 3/4: Second pdflatex pass...
pdflatex -interaction=nonstopmode simops_ieee_paper.tex
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Second pdflatex pass failed!
    pause
    exit /b 1
)

echo.
echo Step 4/4: Final pdflatex pass...
pdflatex -interaction=nonstopmode simops_ieee_paper.tex
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Final pdflatex pass failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Compilation successful!
echo ========================================
echo.
echo Output file: simops_ieee_paper.pdf
echo.

REM Clean up auxiliary files (optional)
echo Cleaning up auxiliary files...
del simops_ieee_paper.aux 2>nul
del simops_ieee_paper.log 2>nul
del simops_ieee_paper.out 2>nul
del simops_ieee_paper.bbl 2>nul
del simops_ieee_paper.blg 2>nul

echo.
echo Opening PDF...
start simops_ieee_paper.pdf

pause

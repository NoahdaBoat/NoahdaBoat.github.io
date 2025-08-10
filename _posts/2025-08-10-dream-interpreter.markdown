---
layout: post
title:  "How to run Dream Interpreter on Windows 2000"
date:   2025-08-10 00:01:54 -0400
categories: technical retro
---
I was fooling around with one of my Windows 2K VMs, and I came across an interesting piece of sofware called "Dream Interpreter" by Expert Software. 

Although the program was released in 1999, it seems like it was written primarily for Windows 3.1 & 95, but I wanted to try in on 2K. 

Running this wasn't as smooth as I had expected, but if you also want to try the program out for yourself, this should provide a good entry point based on what worked for me.

This assumes you have Windows 2000 with SP4 installed.

1. Install the ```windows2000-kb891861-v2-x86-enu_f118bd276f4211929719961a2e929b620c1a2234``` patch to your computer/vm if you haven't already from: https://www.catalog.update.microsoft.com/Search.aspx?q=KB891861

2. Create a batch file with this content
    ```
    @echo off
    set __COMPAT_LAYER=Win98
    D:\DREAM\WIN\SETUP.EXE
    ```

    Run the .bat from the command prompt. This file is also provided if you don't want to create it, see below for link.

    Then go through the installation steps

3. Windows Help \
    This was the hardest part to figure out.

    First you have to disable WFP as you are going to have to change winhelp.exe, located in C:\WINNT

    I found this tutorial to be helpful: https://archive.arstechnica.com/tweak/win2k/others/disable_sfp-1.html

    Follow this part on the page: \
    "How to manage or disable WFP"
    Don't worry about the content below the "to disable" steps.

    Once that's done, bring over winhlp32.exe from: https://archive.org/details/winhlp32_xp_win10_compatible

    Place this inside C:\WINNT, and C:\WINNT\system32, replace files as needed. If there is a winhelp32 inside system32, copy winhlp32 to winhelp32 to replace that file.

    Two ways to do the next part.

    Manual build: \
    Install MinGW from: https://sourceforge.net/projects/mingw/files/OldFiles/MinGW-3.1.0-1.exe/download?use_mirror=master&use_default=umn

    Follow the guide for Download and Installation from https://people.stat.sc.edu/habing/courses/740/mingw.html \
    Note on paths: Create PATH for user env vars if not already made, add ```C:\MINGW\bin;%PATH%```, add ```C:\MINGW\bin;%PATH%``` to system 'Path' also.

    Close and re-open command prompt.

    Then create a folder called ```Programs``` inside the C:\MinGW directory

    Create a new C file called ```winhelp.c``` and add the following code:
    ```C
    #include <windows.h>
    int main(int argc, char *argv[]) {
        if (argc > 1) {
            ShellExecute(NULL, "open", "winhlp32.exe", argv[1], NULL, SW_SHOW);
        }
        return 0;
    }
    ```
    All this does is execute the new winhlp32.exe whenever winhelp.exe is called.

    Compile with:
    ```
    gcc -mwindows winhelp.c -o winhelp.exe
    ```

    Copy the winhelp.exe to C:\WINNT, replace if asked.

    Other option:
    Use my pre-compiled executable. It's the same code as above, just if you don't want to install MinGW. 

It should all work now.

.bat and .exe files located at https://github.com/NoahdaBoat/NoahdaBoat.github.io/tree/gh-pages/source-files/dream-interpreter

If any of the files at the links are gone/down let me know.

<div class="signature-container" style="margin-top: 20px;">
  <img src="/assets/images/signature-white.png" alt="Noah's Signature" class="signature-light" style="max-width: 200px; height: auto;">
  <img src="/assets/images/signature-black.png" alt="Noah's Signature" class="signature-dark" style="max-width: 200px; height: auto;">
</div>

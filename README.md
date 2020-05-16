# mm_viewer
A Project64 debug script for viewing data in Majora's Mask

## Installation
Make sure you have the development version of Project64 installed; the most recent release does not include the Javascript API. You can get that here: 
https://www.pj64-emu.com/nightly-builds

Next, copy all the files (mm.js and the mm folder withe everything in it) to your Project64 install's Scripts directory.

## Running
Open Majora's Mask (U) in Project64.

Enable the Javascript API by following steps from http://shygoo.net/pj64d/:

> In settings, Pause emulation when window is not active and Hide advanced settings should be unchecked.
  In advanced settings, Always use interpreter core and Enable debugger should be checked.

In Project 64, go to Debugger -> Scripts and double-click `mm.js`.

Now, open Chrome to http://localhost:7777/

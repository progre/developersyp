@echo off
if not exist http\src\common (
  mklink /j http\src\common root\src\common
)
if not exist http\src\public\scripts\common (
  mklink /j http\src\public\scripts\common root\src\common
)
echo   npm install (/)
call npm install
echo   npm install (http)
cd http && call npm install && cd ..
echo   npm install (root)
cd root && call npm install && cd ..
echo.
echo Complete!

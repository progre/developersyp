@echo off
echo ジャンクションを作成します
if not exist http\src\common (
  mklink /j http\src\common root\src\common
)
if not exist http\src\public\scripts\common (
  mklink /j http\src\public\scripts\common root\src\common
)
echo.
echo 完了

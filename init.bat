@echo off
echo ジャンクションを作成します
if not exist http\src\common (
  mklink /j http\src\common pcp\src\common
)
if not exist http\src\public\scripts\common (
  mklink /j http\src\public\scripts\common pcp\src\common
)
echo.
echo 完了

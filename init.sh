echo シンボリックリンクを作成します
if ! test -e http/src/common; then
  ln -nsv ../../pcp/src/common http/src/common
fi
if ! test -e http/src/public/scripts/common; then
  ln -nsv ../../../../pcp/src/common http/src/public/scripts/common
fi
echo
echo 完了

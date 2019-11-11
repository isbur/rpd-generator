# Генератор РПД

https://github.com/isbur/rpd-generator-public – файлы для доступа без авторизации.

`devfile.yaml` – нужно скопировать содержимое в интерфейсе настройки workspace в Che

https://drive.google.com/drive/folders/1vwloMcEt6jZ3hJuH8ROcSQBIXgu6VBUa – основная рабочая папка

https://github.com/google/clasp – инструмент для переноса workflow разработки из браузера в произвольную IDE

`clasp clone <script_ID>` – script_ID единый для всех `.gs` файлов, привязанных к spreadsheet

## dockerimage

https://labs.play-with-docker.com

``` dockerfile
git clone https://github.com/isbur/rpd-generator-public
docker build -t isbur/rpd-generator-image ./rpd-generator-public
docker login
docker push isbur/rpd-generator-image
```
## RTD документация

``` bash
make html

rm -rf /projects/rpd-generator-public/docs
mkdir /projects/rpd-generator-public/docs
cp -r /projects/rpd-generator/docs /projects/rpd-generator-public
```

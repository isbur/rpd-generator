# rpd-generator-public

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

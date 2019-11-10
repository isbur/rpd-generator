FROM quay.io/eclipse/che-nodejs10-ubi:nightly

USER root

RUN npm install -g yarn 
RUN yarn global add clasp jsdoc

RUN yum install -y python3
RUN pip3 install sphinx-js sphinx-markdown-builder

RUN git config --global credential.helper store 
RUN git config --global alias.add-commit '!git add -A && git commit'

FROM quay.io/eclipse/che-nodejs10-ubi:nightly

RUN npm install -g yarn 
RUN yarn global add clasp

RUN git config --global credential.helper store 
RUN git config --global alias.add-commit '!git add -A && git commit'

FROM ruby:3.0.2

WORKDIR /app

RUN apt-get update -qq \
  && apt-get install -y --no-install-recommends build-essential sqlite3 libsqlite3-dev \
  && rm -rf /var/lib/apt/lists/*

COPY Gemfile Gemfile.lock ./
RUN gem install bundler:2.3.26 \
  && bundle config set path /usr/local/bundle \
  && bundle install

COPY . .

EXPOSE 3000

CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "3000"]

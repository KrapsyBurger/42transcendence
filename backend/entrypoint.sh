#!/bin/bash

until nc -z ft_transcendence-dev-db-1 5432
do
  echo "Waiting for the database to be ready..."
  sleep 1
done

npx prisma migrate deploy

exec "$@"
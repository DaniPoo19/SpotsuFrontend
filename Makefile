.PHONY: upd upi down ps build

upd:
	docker compose up --build -d

upi:
	docker compose up --build

down:
	docker compose down

ps:
	docker compose ps

build:
	git checkout $(MAIN_BRANCH)
	git pull origin $(MAIN_BRANCH)
	docker compose build

clean:
	docker compose down
	docker compose rm -f
	docker compose build --no-cache

import random
from enum import Enum
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)


class RPS(Enum):
    ROCK = 1
    PAPER = 2
    SCISSOR = 3


game_state = {
    "name": "PlayerOne",
    "game_count": 0,
    "player_wins": 0,
    "python_wins": 0,
}


def decide_winner(player, computer):
    if player == 1 and computer == 3:
        game_state["player_wins"] += 1
        return f"\U0001F389 {game_state['name']}, you win!"
    elif player == 2 and computer == 1:
        game_state["player_wins"] += 1
        return f"\U0001F389 {game_state['name']}, you win!"
    elif player == 3 and computer == 2:
        game_state["player_wins"] += 1
        return f"\U0001F389 {game_state['name']}, you win!"
    elif player == computer:
        return "\U0001F62E Tie game!"
    else:
        game_state["python_wins"] += 1
        return f"\U0001F40D Python wins! Sorry, {game_state['name']}.."


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/set_name", methods=["POST"])
def set_name():
    typed = request.get_json().get("name", "").strip()
    game_state["name"] = typed if typed else "PlayerOne"
    game_state["game_count"] = 0
    game_state["player_wins"] = 0
    game_state["python_wins"] = 0
    return jsonify({"name": game_state["name"]})


@app.route("/play", methods=["POST"])
def play():
    player = int(request.get_json()["choice"])
    computer = int(random.choice("123"))

    message = decide_winner(player, computer)
    game_state["game_count"] += 1

    return jsonify({
        "message": message,
        "computer": computer,
        "game_count": game_state["game_count"],
        "player_wins": game_state["player_wins"],
        "python_wins": game_state["python_wins"],
    })


if __name__ == "__main__":
    app.run(debug=True)
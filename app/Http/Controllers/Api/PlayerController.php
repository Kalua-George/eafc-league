<?php

namespace App\Http\Controllers\Api;

use App\Enums\PlayerStatus;
use App\Models\Player;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlayerController extends ApiController
{
    /** Admin: list players, optionally filtered by ?status=pending|approved|rejected. */
    public function index(Request $request): JsonResponse
    {
        $status = PlayerStatus::tryFrom((string) $request->query('status'));

        $players = Player::query()
            ->when($status, fn ($q) => $q->where('status', $status->value))
            ->orderBy('status')
            ->orderBy('gamer_tag')
            ->get()
            ->map(fn (Player $p) => $this->present($p, withCreatedAt: true))
            ->all();

        $this->log('get_players', 'players', 'Viewed players list');

        return $this->ok(['players' => $players, 'count' => count($players)]);
    }

    /** Public: look a player up by gamer tag or phone number. */
    public function search(Request $request): JsonResponse
    {
        $identifier = trim((string) ($request->query('identifier') ?? $request->query('gamer_tag') ?? ''));

        if ($identifier === '') {
            $this->log('get_player', 'players', 'Missing search identifier', null, 'failed');

            return $this->fail('Missing search identifier', 400);
        }

        $player = Player::where('gamer_tag', $identifier)->orWhere('phone', $identifier)->first();

        if (! $player) {
            $this->log('get_player', 'players', 'Player not found', null, 'failed');

            return $this->fail('Player not found', 404);
        }

        $this->log('get_player', 'players', 'Viewed player status', $player->id);

        return $this->ok(['player' => $this->present($player)]);
    }

    /** Public registration (pending approval); admins may register + approve in one step. */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validated(
            $request,
            [
                'gamer_tag' => ['required', 'string', 'max:100'],
                'phone' => ['required', 'string', 'max:30'],
            ],
            'add_player',
            'players',
            'Gamer tag and phone number are required',
        );

        if (Player::where('gamer_tag', $data['gamer_tag'])->exists()) {
            $this->log('add_player', 'players', 'Duplicate gamer_tag', null, 'failed');

            return $this->fail('Gamer tag already exists', 409);
        }

        $isAdmin = $this->isAdmin();
        $status = ($isAdmin && $request->boolean('admin_action')) ? PlayerStatus::Approved : PlayerStatus::Pending;

        $player = Player::create($data + ['status' => $status]);

        if (! $isAdmin) {
            // Lets the registrant edit their own profile later in this session.
            $request->session()->put('player_id', $player->id);
        }

        $this->log('add_player', 'players', "Added player {$player->gamer_tag} with status {$status->value}", $player->id);

        return $this->ok([
            'message' => $isAdmin
                ? 'Player registered and approved successfully'
                : 'Player registered successfully, pending approval',
            'player_id' => $player->id,
            'status' => $status->value,
        ], 201);
    }

    /** Admin: approve or reject a registration. */
    public function updateStatus(Request $request): JsonResponse
    {
        $data = $this->validated(
            $request,
            [
                'player_id' => ['required', 'integer', 'min:1'],
                'action' => ['required', Rule::in(['approve', 'reject'])],
            ],
            'update_player_status',
            'players',
            'Valid player_id and action are required',
            (int) $request->input('player_id') ?: null,
        );

        $player = Player::find($data['player_id']);

        if (! $player) {
            $this->log('update_player_status', 'players', 'Player not found', (int) $data['player_id'], 'failed');

            return $this->fail('Player not found', 404);
        }

        $newStatus = $data['action'] === 'approve' ? PlayerStatus::Approved : PlayerStatus::Rejected;
        $player->update(['status' => $newStatus]);

        $this->log('update_player_status', 'players', "Player status updated to {$newStatus->value}", $player->id);

        return $this->ok([
            'message' => "Player status updated to {$newStatus->value}",
            'player_id' => $player->id,
            'status' => $newStatus->value,
        ]);
    }

    /** Admin, or the player themselves (same session that registered them). */
    public function update(Request $request): JsonResponse
    {
        $playerId = (int) $request->input('player_id');
        $isSelf = $playerId > 0 && (int) $request->session()->get('player_id') === $playerId;

        if (! $this->isAdmin() && ! $isSelf) {
            $this->log('edit_player', 'players', 'Unauthorized edit attempt', $playerId ?: null, 'failed');

            return $this->fail('Unauthorized', 401);
        }

        $data = $this->validated(
            $request,
            [
                'player_id' => ['required', 'integer', 'min:1'],
                'gamer_tag' => ['required', 'string', 'max:100'],
                'phone' => ['required', 'string', 'max:30'],
            ],
            'edit_player',
            'players',
            'Player id, gamer tag, and phone are required',
            $playerId ?: null,
        );

        $player = Player::find($data['player_id']);

        if (! $player) {
            $this->log('edit_player', 'players', 'Player not found', $playerId, 'failed');

            return $this->fail('Player not found', 404);
        }

        if (Player::where('gamer_tag', $data['gamer_tag'])->whereKeyNot($player->id)->exists()) {
            $this->log('edit_player', 'players', 'Duplicate gamer_tag on profile update', $player->id, 'failed');

            return $this->fail('Gamer tag already exists', 409);
        }

        $player->update(['gamer_tag' => $data['gamer_tag'], 'phone' => $data['phone']]);

        $this->log('edit_player', 'players', 'Player updated successfully', $player->id);

        return $this->ok(['message' => 'Player updated successfully', 'player_id' => $player->id]);
    }

    private function present(Player $player, bool $withCreatedAt = false): array
    {
        return [
            'id' => $player->id,
            'gamer_tag' => $player->gamer_tag,
            'phone' => $player->phone,
            'status' => $player->status->value,
        ] + ($withCreatedAt ? ['created_at' => $player->created_at?->toIso8601String()] : []);
    }
}

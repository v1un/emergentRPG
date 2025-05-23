// MongoDB initialization script for EmergentRPG
print('Initializing EmergentRPG database...');

// Create the database
db = db.getSiblingDB('emergentRPG');

// Create collections with indexes
db.createCollection('game_sessions');
db.createCollection('characters');
db.createCollection('story_entries');
db.createCollection('lorebooks');
db.createCollection('scenarios');
db.createCollection('generation_tasks');

// Create indexes for better performance
print('Creating indexes...');

// Game sessions indexes
db.game_sessions.createIndex({ "session_id": 1 }, { unique: true });
db.game_sessions.createIndex({ "created_at": 1 });
db.game_sessions.createIndex({ "updated_at": 1 });

// Characters indexes
db.characters.createIndex({ "character_id": 1 }, { unique: true });
db.characters.createIndex({ "session_id": 1 });
db.characters.createIndex({ "name": 1 });

// Story entries indexes
db.story_entries.createIndex({ "session_id": 1 });
db.story_entries.createIndex({ "timestamp": 1 });
db.story_entries.createIndex({ "entry_type": 1 });

// Lorebooks indexes
db.lorebooks.createIndex({ "lorebook_id": 1 }, { unique: true });
db.lorebooks.createIndex({ "series_type": 1 });
db.lorebooks.createIndex({ "created_at": 1 });

// Scenarios indexes
db.scenarios.createIndex({ "scenario_id": 1 }, { unique: true });
db.scenarios.createIndex({ "scenario_type": 1 });
db.scenarios.createIndex({ "created_at": 1 });

// Generation tasks indexes
db.generation_tasks.createIndex({ "task_id": 1 }, { unique: true });
db.generation_tasks.createIndex({ "status": 1 });
db.generation_tasks.createIndex({ "created_at": 1 });

print('Database initialization completed successfully!');

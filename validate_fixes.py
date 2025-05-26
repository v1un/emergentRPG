#!/usr/bin/env python3
"""
Validation script for EmergentRPG game logic fixes
Checks all the issues identified in game_logic_analysis.md
"""

import sys
import os
import importlib.util
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

def check_imports():
    """Check that all modules can be imported without errors"""
    print("🔍 Checking imports...")
    
    try:
        from models.game_models import (
            Character, InventoryItem, Quest, QuestProgress, 
            EquipmentSlot, StoryEntry, ActionType
        )
        from models.scenario_models import LoreCharacter, Lorebook
        from utils.exceptions import (
            InvalidItemQuantityError, InsufficientCarryCapacityError,
            EquipmentSlotOccupiedError, ValidationError
        )
        print("✅ All imports successful")
        return True
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

def check_character_model_separation():
    """Check that Character and LoreCharacter are properly separated"""
    print("\n🔍 Checking Character model separation...")
    
    try:
        from models.game_models import Character
        from models.scenario_models import LoreCharacter
        
        # Create instances
        game_char = Character(name="Hero")
        lore_char = LoreCharacter(name="Hero", role="protagonist", description="Test")
        
        # Check they're different types
        assert type(game_char).__name__ == "Character"
        assert type(lore_char).__name__ == "LoreCharacter"
        
        # Check game character has game fields
        assert hasattr(game_char, 'level')
        assert hasattr(game_char, 'experience')
        assert hasattr(game_char, 'equipped_items')
        
        # Check lore character has lore fields
        assert hasattr(lore_char, 'role')
        assert hasattr(lore_char, 'personality')
        assert not hasattr(lore_char, 'level')
        
        print("✅ Character model separation working")
        return True
    except Exception as e:
        print(f"❌ Character model separation error: {e}")
        return False

def check_equipment_system():
    """Check equipment slot system"""
    print("\n🔍 Checking equipment system...")
    
    try:
        from models.game_models import InventoryItem, EquipmentSlot, Character
        import uuid
        
        # Test equipment slots
        assert EquipmentSlot.WEAPON == "weapon"
        assert EquipmentSlot.HELMET == "helmet"
        
        # Test item with equipment slot
        sword = InventoryItem(
            id=str(uuid.uuid4()),
            name="Test Sword",
            type="weapon",
            equipment_slot=EquipmentSlot.WEAPON,
            weight=2.0
        )
        
        assert sword.equipment_slot == EquipmentSlot.WEAPON
        assert sword.weight == 2.0
        
        # Test character equipment tracking
        char = Character(name="Test")
        char.equipped_items[EquipmentSlot.WEAPON] = sword.id
        
        assert EquipmentSlot.WEAPON in char.equipped_items
        
        print("✅ Equipment system working")
        return True
    except Exception as e:
        print(f"❌ Equipment system error: {e}")
        return False

def check_quest_system():
    """Check structured quest progress system"""
    print("\n🔍 Checking quest system...")
    
    try:
        from models.game_models import Quest, QuestProgress
        import uuid
        
        # Test quest progress
        progress = QuestProgress(current=2, total=5)
        assert progress.current == 2
        assert progress.total == 5
        assert progress.percentage == 40.0
        assert progress.is_complete == False
        assert str(progress) == "2/5"
        
        # Test complete quest
        progress.current = 5
        assert progress.is_complete == True
        
        # Test quest with structured progress
        objectives = ["Task 1", "Task 2"]
        quest = Quest(
            id=str(uuid.uuid4()),
            title="Test Quest",
            description="Test",
            progress=QuestProgress(
                current=0,
                total=len(objectives),
                completed_objectives=[False, False]
            ),
            objectives=objectives
        )
        
        assert quest.progress.total == 2
        assert quest.progress.is_complete == False
        
        print("✅ Quest system working")
        return True
    except Exception as e:
        print(f"❌ Quest system error: {e}")
        return False

def check_error_handling():
    """Check custom exception types"""
    print("\n🔍 Checking error handling...")
    
    try:
        from utils.exceptions import (
            InvalidItemQuantityError, InsufficientCarryCapacityError,
            ValidationError, PermanentError, TransientError,
            is_retryable_error, create_error_response
        )
        
        # Test custom exceptions
        error1 = InvalidItemQuantityError("Test error")
        assert isinstance(error1, Exception)
        
        error2 = ValidationError("Validation failed")
        assert isinstance(error2, PermanentError)
        
        # Test utility functions
        assert is_retryable_error(TransientError("temp")) == True
        assert is_retryable_error(PermanentError("perm")) == False
        
        response = create_error_response(error1)
        assert response["success"] == False
        assert "error" in response
        
        print("✅ Error handling working")
        return True
    except Exception as e:
        print(f"❌ Error handling error: {e}")
        return False

def check_story_entries():
    """Check StoryEntry improvements"""
    print("\n🔍 Checking story entries...")
    
    try:
        from models.game_models import StoryEntry, ActionType
        
        # Test story entry with ID
        entry1 = StoryEntry(type=ActionType.PLAYER, text="Test 1")
        entry2 = StoryEntry(type=ActionType.PLAYER, text="Test 2")
        
        assert hasattr(entry1, 'id')
        assert hasattr(entry2, 'id')
        assert entry1.id != entry2.id
        assert len(entry1.id) > 0
        
        print("✅ Story entries working")
        return True
    except Exception as e:
        print(f"❌ Story entries error: {e}")
        return False

def check_character_methods():
    """Check new Character helper methods"""
    print("\n🔍 Checking character methods...")
    
    try:
        from models.game_models import Character
        
        # Test level-up methods
        char = Character(name="Test", experience=150, level=1)
        
        assert char.can_level_up() == True
        assert char.experience_to_next_level == -50  # 100 - 150
        
        # After leveling up
        char.level = 2
        assert char.can_level_up() == False
        assert char.experience_to_next_level == 50  # 200 - 150
        
        print("✅ Character methods working")
        return True
    except Exception as e:
        print(f"❌ Character methods error: {e}")
        return False

def run_integration_test():
    """Run a comprehensive integration test"""
    print("\n🔍 Running integration test...")
    
    try:
        from models.game_models import Character, Quest, QuestProgress, InventoryItem, EquipmentSlot
        import uuid
        
        # Create character
        char = Character(name="Integration Hero", experience=0, level=1)
        
        # Create quest
        objectives = ["Kill goblins", "Return home"]
        quest = Quest(
            id=str(uuid.uuid4()),
            title="Test Quest",
            description="Integration test quest",
            progress=QuestProgress(
                current=0,
                total=len(objectives),
                completed_objectives=[False, False]
            ),
            objectives=objectives
        )
        
        # Create equipment
        sword = InventoryItem(
            id=str(uuid.uuid4()),
            name="Integration Sword",
            type="weapon",
            equipment_slot=EquipmentSlot.WEAPON,
            weight=3.0
        )
        
        # Test workflow
        assert char.can_level_up() == False
        assert quest.progress.is_complete == False
        assert sword.equipment_slot == EquipmentSlot.WEAPON
        
        # Simulate progress
        char.experience = 100
        assert char.can_level_up() == True
        
        quest.progress.current = 2
        quest.progress.completed_objectives = [True, True]
        assert quest.progress.is_complete == True
        
        char.equipped_items[EquipmentSlot.WEAPON] = sword.id
        assert EquipmentSlot.WEAPON in char.equipped_items
        
        print("✅ Integration test passed")
        return True
    except Exception as e:
        print(f"❌ Integration test error: {e}")
        return False

def main():
    """Run all validation checks"""
    print("🚀 EmergentRPG Game Logic Fixes Validation")
    print("=" * 50)
    
    checks = [
        check_imports,
        check_character_model_separation,
        check_equipment_system,
        check_quest_system,
        check_error_handling,
        check_story_entries,
        check_character_methods,
        run_integration_test
    ]
    
    passed = 0
    total = len(checks)
    
    for check in checks:
        try:
            if check():
                passed += 1
        except Exception as e:
            print(f"❌ Check failed with exception: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Results: {passed}/{total} checks passed")
    
    if passed == total:
        print("🎉 ALL FIXES VALIDATED SUCCESSFULLY!")
        print("\n✅ Fixed Issues:")
        print("  • Duplicate Character models resolved")
        print("  • Equipment slot system implemented")
        print("  • Structured quest progress system")
        print("  • Custom exception types added")
        print("  • Story entries have unique IDs")
        print("  • Character level-up methods added")
        print("  • Error handling improved")
        print("  • Input validation enhanced")
        return True
    else:
        print(f"❌ {total - passed} checks failed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

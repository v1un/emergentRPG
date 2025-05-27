// Inventory Panel Component - Item management interface

'use client';

import React, { useState, useRef } from 'react';
import { useCurrentInventory, useCurrentCharacter, useGameStore } from '@/stores/gameStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/helpers';
import { gameFormatters } from '@/utils/formatting';
import { InventoryItem, EquipmentSlot } from '@/types';
import {
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  UserIcon,
  CogIcon,
  StarIcon,
  TrashIcon,
  ArrowsRightLeftIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'type' | 'value' | 'weight' | 'rarity';

export function InventoryPanel() {
  const inventory = useCurrentInventory();
  const character = useCurrentCharacter();
  const { updateSession } = useGameStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [draggedItem, setDraggedItem] = useState<InventoryItem | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonItem, setComparisonItem] = useState<InventoryItem | null>(null);

  // Get unique item types for filtering
  const itemTypes = ['all', ...new Set(inventory.map(item => item.item_type))];

  // Filter and sort inventory
  const filteredInventory = inventory
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || item.item_type === selectedType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.item_type.localeCompare(b.item_type);
        case 'value':
          return b.value - a.value;
        case 'weight':
          return b.weight - a.weight;
        case 'rarity':
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
          return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
        default:
          return 0;
      }
    });

  const totalWeight = inventory.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const totalValue = inventory.reduce((sum, item) => sum + (item.value * item.quantity), 0);

  const getItemIcon = (type: string) => {
    const icons: Record<string, string> = {
      weapon: '⚔️',
      armor: '🛡️',
      consumable: '🧪',
      tool: '🔧',
      treasure: '💎',
      misc: '📦',
    };
    return icons[type] || '📦';
  };

  // Item action handlers
  const handleUseItem = (item: InventoryItem) => {
    if (item.item_type === 'consumable') {
      // TODO: Implement consumable use logic
      console.log('Using consumable:', item.name);
    } else {
      console.log('Cannot use this item type:', item.item_type);
    }
  };

  const handleEquipItem = (item: InventoryItem) => {
    if (!character) return;

    const equipmentSlots: Record<string, EquipmentSlot> = {
      weapon: 'weapon',
      armor: 'armor',
      helmet: 'helmet',
      boots: 'boots',
      accessory: 'accessory',
    };

    const slot = equipmentSlots[item.item_type];
    if (slot) {
      const updatedEquipment = { ...character.equipped_items };
      updatedEquipment[slot] = item.name;

      updateSession({
        character: {
          ...character,
          equipped_items: updatedEquipment,
        },
      });

      // Show comparison if there was an item already equipped
      if (character.equipped_items[slot]) {
        setComparisonItem(item);
        setShowComparison(true);
      }
    }
  };

  const handleDropItem = (item: InventoryItem) => {
    // TODO: Implement drop item logic
    console.log('Dropping item:', item.name);
  };

  const handleCompareItem = (item: InventoryItem) => {
    setComparisonItem(item);
    setShowComparison(true);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: InventoryItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetItem: InventoryItem) => {
    e.preventDefault();
    if (draggedItem && draggedItem.id !== targetItem.id) {
      // TODO: Implement item swapping logic
      console.log('Swapping items:', draggedItem.name, 'with', targetItem.name);
    }
    setDraggedItem(null);
  };

  const renderItemCard = (item: InventoryItem) => {
    const rarityInfo = gameFormatters.itemRarity(item.rarity);
    const isEquippable = ['weapon', 'armor', 'helmet', 'boots', 'accessory'].includes(item.item_type);
    const isConsumable = item.item_type === 'consumable';

    return (
      <Card
        key={item.id}
        className={cn(
          'cursor-pointer transition-all duration-200 hover:shadow-md group relative',
          selectedItem?.id === item.id && 'ring-2 ring-primary',
          draggedItem?.id === item.id && 'opacity-50'
        )}
        onClick={() => setSelectedItem(item)}
        draggable
        onDragStart={(e) => handleDragStart(e, item)}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, item)}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl flex-shrink-0">
              {getItemIcon(item.item_type)}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground truncate">
                {item.name}
              </h4>
              <p className={cn('text-xs font-medium', rarityInfo.className)}>
                {rarityInfo.text}
              </p>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {item.description}
              </p>
              <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                <span>Qty: {item.quantity}</span>
                <span>{gameFormatters.itemValue(item.value)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons - Show on Hover */}
          <div className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              {isConsumable && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUseItem(item);
                  }}
                  className="flex-1 text-xs"
                >
                  Use
                </Button>
              )}
              {isEquippable && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEquipItem(item);
                  }}
                  className="flex-1 text-xs"
                >
                  Equip
                </Button>
              )}
              {isEquippable && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCompareItem(item);
                  }}
                  className="flex-1 text-xs"
                >
                  <ArrowsRightLeftIcon className="h-3 w-3" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDropItem(item);
                }}
                className="text-xs text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderItemList = (item: InventoryItem) => {
    const rarityInfo = gameFormatters.itemRarity(item.rarity);
    
    return (
      <div
        key={item.id}
        className={cn(
          'flex items-center space-x-4 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted',
          selectedItem?.id === item.id && 'bg-accent'
        )}
        onClick={() => setSelectedItem(item)}
      >
        <span className="text-xl flex-shrink-0">
          {getItemIcon(item.item_type)}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">
            {item.name}
          </h4>
          <p className="text-sm text-muted-foreground truncate">
            {item.description}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className={cn('font-medium', rarityInfo.className)}>
            {rarityInfo.text}
          </p>
          <p className="text-muted-foreground">
            {item.quantity}x
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="font-medium text-foreground">
            {gameFormatters.itemValue(item.value)}
          </p>
          <p className="text-muted-foreground">
            {gameFormatters.weight(item.weight)}
          </p>
        </div>
      </div>
    );
  };

  if (inventory.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <ShoppingBagIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Empty Inventory
          </h3>
          <p className="text-muted-foreground">
            Your adventure awaits! Find items to fill your inventory.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Main Inventory */}
      <div className="flex-1 flex flex-col">
        {/* Header with Stats */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {inventory.length}
              </p>
              <p className="text-sm text-muted-foreground">Items</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {gameFormatters.weight(totalWeight)}
              </p>
              <p className="text-sm text-muted-foreground">Weight</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {gameFormatters.itemValue(totalValue)}
              </p>
              <p className="text-sm text-muted-foreground">Value</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
              >
                {itemTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
              >
                <option value="name">Name</option>
                <option value="type">Type</option>
                <option value="value">Value</option>
                <option value="weight">Weight</option>
                <option value="rarity">Rarity</option>
              </select>
              <div className="flex border border-input rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <ListBulletIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Grid/List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No items match your search criteria.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredInventory.map(renderItemCard)}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInventory.map(renderItemList)}
            </div>
          )}
        </div>
      </div>

      {/* Item Detail Sidebar */}
      {selectedItem && (
        <div className="w-80 border-l border-gray-200 dark:border-gray-800 bg-card p-6">
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-4xl">{getItemIcon(selectedItem.item_type)}</span>
              <h3 className="text-lg font-semibold text-foreground mt-2">
                {selectedItem.name}
              </h3>
              <p className={cn('text-sm font-medium', gameFormatters.itemRarity(selectedItem.rarity).className)}>
                {gameFormatters.itemRarity(selectedItem.rarity).text}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {selectedItem.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{selectedItem.item_type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Quantity</p>
                <p className="font-medium">{selectedItem.quantity}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Value</p>
                <p className="font-medium">{gameFormatters.itemValue(selectedItem.value)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Weight</p>
                <p className="font-medium">{gameFormatters.weight(selectedItem.weight)}</p>
              </div>
            </div>

            {selectedItem.properties && Object.keys(selectedItem.properties).length > 0 && (
              <div>
                <h4 className="font-medium text-foreground mb-2">Properties</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(selectedItem.properties).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key.replace('_', ' ')}
                      </span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {selectedItem.item_type === 'consumable' && (
                <Button
                  className="w-full"
                  onClick={() => handleUseItem(selectedItem)}
                >
                  <InformationCircleIcon className="h-4 w-4 mr-2" />
                  Use Item
                </Button>
              )}
              {['weapon', 'armor', 'helmet', 'boots', 'accessory'].includes(selectedItem.item_type) && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => handleEquipItem(selectedItem)}
                  >
                    <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
                    Equip Item
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCompareItem(selectedItem)}
                  >
                    <ArrowsRightLeftIcon className="h-4 w-4 mr-2" />
                    Compare Equipment
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                className="w-full text-red-600 hover:text-red-700"
                onClick={() => handleDropItem(selectedItem)}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Drop Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryPanel;

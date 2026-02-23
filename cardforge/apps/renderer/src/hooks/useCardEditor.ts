// src/hooks/useCardEditor.ts
// Convenience hook that combines cardEditorStore selectors with
// derived state and action wrappers for clean component usage.
import { useCallback } from 'react';
import { useCardEditorStore } from '../store/cardEditorStore';
import type { CardFrameData } from '../ui/layout/components/ui/CardFrame';

export function useCardEditor() {
    const store = useCardEditorStore();

    // Derive the CardFrameData snapshot for CardFrame rendering
    const cardData: CardFrameData = {
        title: store.title,
        description: store.description,
        element: store.element,
        rarity: store.rarity,
        attack: store.attack,
        hp: store.hp,
        cost: store.cost,
        traits: store.traits,
        imageUrl: store.imageUrl,
    };

    // Apply a full card snapshot (e.g., from AI generation or template)
    const applyCard = useCallback((data: CardFrameData) => {
        store.patchCard({
            title: data.title ?? store.title,
            description: data.description ?? store.description,
            element: (data.element ?? store.element) as any,
            rarity: (data.rarity ?? store.rarity) as any,
            attack: data.attack ?? store.attack,
            hp: data.hp ?? store.hp,
            cost: data.cost ?? store.cost,
            traits: data.traits ?? store.traits,
            imageUrl: data.imageUrl,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        // State
        cardData,
        isDirty: store.isDirty,

        // All primitive setters
        setTitle: store.setTitle,
        setDescription: store.setDescription,
        setElement: store.setElement,
        setRarity: store.setRarity,
        setAttack: store.setAttack,
        setHp: store.setHp,
        setCost: store.setCost,
        setTraits: store.setTraits,
        toggleTrait: store.toggleTrait,
        setImageUrl: store.setImageUrl,

        // Compound actions
        applyCard,
        resetCard: store.resetCard,
        markClean: store.markClean,

        // Layer State & Actions
        layers: store.layers,
        activeLayerId: store.activeLayerId,
        isTransformMode: store.isTransformMode,
        imageUrl: store.imageUrl,
        setLayers: store.setLayers,
        addLayer: store.addLayer,
        removeLayer: store.removeLayer,
        toggleLayerVisibility: store.toggleLayerVisibility,
        setActiveLayerId: store.setActiveLayerId,
        setTransformMode: store.setTransformMode,
        clearArtImage: store.clearArtImage,
        bringLayerForward: store.bringLayerForward,
        sendLayerBackward: store.sendLayerBackward,
        badgePositions: store.badgePositions,
        updateBadgePosition: store.updateBadgePosition,
        showDescription: store.showDescription,
        artZoneHeight: store.artZoneHeight,
        toggleDescription: store.toggleDescription,
        setArtZoneHeight: store.setArtZoneHeight,
        isTemplateGalleryOpen: store.isTemplateGalleryOpen,
        activeTemplateId: store.activeTemplateId,
        toggleTemplateGallery: store.toggleTemplateGallery,
        closeTemplateGallery: store.closeTemplateGallery,
        applyTemplate: store.applyTemplate,
        zoomLevel: store.zoomLevel,
        zoomIn: store.zoomIn,
        zoomOut: store.zoomOut,
        resetZoom: store.resetZoom,
    };
}

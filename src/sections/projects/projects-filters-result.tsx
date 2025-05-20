import type { ProjectFilters } from 'src/types/project';
import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { FiltersResultProps } from 'src/components/filters-result';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = FiltersResultProps & {
  filters: UseSetStateReturn<ProjectFilters>;
};

export function ProjectsFiltersResult({ filters, totalResults, sx }: Props) {
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

  const handleRemoveTags = useCallback(
    (inputValue: string) => {
      const newValue = currentFilters.tags.filter((item) => item !== inputValue);
      updateFilters({ tags: newValue });
    },
    [updateFilters, currentFilters.tags]
  );

  const handleRemoveVisibility = useCallback(
    (inputValue: string) => {
      const newValue = currentFilters.visibility.filter((item) => item !== inputValue);
      updateFilters({ visibility: newValue });
    },
    [updateFilters, currentFilters.visibility]
  );

  return (
    <FiltersResult totalResults={totalResults} onReset={() => resetFilters()} sx={sx}>
      <FiltersBlock label="Tags:" isShow={!!currentFilters.tags.length}>
        {currentFilters.tags.map((item) => (
          <Chip {...chipProps} key={item} label={item} onDelete={() => handleRemoveTags(item)} />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Visibility:" isShow={!!currentFilters.visibility.length}>
        {currentFilters.visibility.map((item) => (
          <Chip
            {...chipProps}
            key={item}
            label={item}
            onDelete={() => handleRemoveVisibility(item)}
          />
        ))}
      </FiltersBlock>
    </FiltersResult>
  );
}

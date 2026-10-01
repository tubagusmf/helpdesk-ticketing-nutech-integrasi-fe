import { useEffect, useState } from "react";

import {
  EMPTY_FILTERS,
} from "../utils/dashboard";

import {
  getDashboardProjects,
} from "../services/dashboardService";

import { getParts } from "../services/ticketService";

export default function useDashboardFilters() {
  const [filters, setFilters] =
    useState({ ...EMPTY_FILTERS });

  const [appliedFilters, setAppliedFilters] =
    useState({ ...EMPTY_FILTERS });

  const [projects, setProjects] =
    useState([]);

  const [parts, setParts] =
    useState([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const result =
          await getDashboardProjects();

        setProjects(result || []);
      } catch (error) {
        console.error(
          "Get dashboard projects error:",
          error,
        );

        setProjects([]);
      }
    };

    loadProjects();
  }, []);

  useEffect(() => {
    if (!filters.project_id) {
      setParts([]);
      return;
    }

    const loadParts = async () => {
      try {
        const response = await getParts(
          filters.project_id,
        );

        setParts(response?.data || []);
      } catch (error) {
        console.error(
          "Get parts error:",
          error,
        );

        setParts([]);
      }
    };

    loadParts();
  }, [filters.project_id]);

  const handleFilterChange = (changes) => {
    setFilters((prev) => ({
      ...prev,
      ...changes,
    }));
  };

  const handleFilter = () => {
    setAppliedFilters({
      ...filters,
    });
  };

  const handleReset = () => {
    const reset = {
      ...EMPTY_FILTERS,
    };

    setFilters(reset);
    setAppliedFilters(reset);
  };

  return {
    filters,
    appliedFilters,
    projects,
    parts,
    handleFilterChange,
    handleFilter,
    handleReset,
  };
}
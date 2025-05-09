import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { ProjectAnalysis, FileType } from "@/types";

type ProjectState = {
  currentProject: ProjectAnalysis | null;
  analysisInProgress: boolean;
  progress: number;
  error: string | null;
};

type ProjectAction =
  | { type: 'START_ANALYSIS'; payload: { repositoryUrl?: string; zipFile?: File; language: string } }
  | { type: 'ANALYSIS_COMPLETE'; payload: ProjectAnalysis }
  | { type: 'ANALYSIS_PROGRESS'; payload: number }
  | { type: 'ANALYSIS_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: ProjectState = {
  currentProject: null,
  analysisInProgress: false,
  progress: 0,
  error: null
};

const ProjectContext = createContext<{
  state: ProjectState;
  dispatch: React.Dispatch<ProjectAction>;
}>({
  state: initialState,
  dispatch: () => null
});

function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'START_ANALYSIS':
      return {
        ...state,
        analysisInProgress: true,
        progress: 0,
        error: null
      };
    case 'ANALYSIS_COMPLETE':
      return {
        ...state,
        currentProject: action.payload,
        analysisInProgress: false,
        progress: 100,
        error: null
      };
    case 'ANALYSIS_PROGRESS':
      return {
        ...state,
        progress: action.payload
      };
    case 'ANALYSIS_ERROR':
      return {
        ...state,
        analysisInProgress: false,
        error: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
}

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  return (
    <ProjectContext.Provider value={{ state, dispatch }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);

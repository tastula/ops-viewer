import React, { useEffect, useState } from 'react';
import courseData from './res/newCourses.json';
import Tree from 'react-d3-tree';
import { CourseUnit, PrerequisiteGroup } from './models';
import { RawNodeDatum } from 'react-d3-tree/lib/types/common';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import ListGroup from 'react-bootstrap/ListGroup';
import Navbar from 'react-bootstrap/Navbar';

// Make sure only currently available courses appear
const filterCurriculums = true;
const cleanedCourseData: CourseUnit[] = (courseData as CourseUnit[]).filter((course: CourseUnit) => {
  return filterCurriculums ? course.curriculumPeriodIds.some((curriculum: string) => curriculum.includes('2020')) : true;
});

// Index courses by both internal groupId and known course code
const indexedCourses = new Map<string, CourseUnit>();
cleanedCourseData.forEach((course) => {
  indexedCourses.set(course.groupId, course);
  indexedCourses.set(course.code, course);
});

// List of available course codes
const courseCodes = cleanedCourseData.map((course) => course.code);

const preferEnglish: boolean = true;
const selectName = (course: CourseUnit | undefined, english: boolean = preferEnglish): string => {
  if(course) {
    if(english) return course.name.en ?? course.name.fi ?? 'error';
    return course.name.fi ?? course.name.en ?? 'error';
  }
  return 'error';
};

const createNodesForCourse = (preGroup: PrerequisiteGroup, compulsory: boolean = true): RawNodeDatum[] | undefined => {
  return preGroup.prerequisites.map((prerequisite) => {
    // Course, continue recursion
    if(prerequisite?.courseUnitGroupId) {
      const course = indexedCourses.get(prerequisite.courseUnitGroupId);
      if(course) {
        const preGroups = createNodesForPreGroup(course);
        return {
          name: selectName(course),
          children: preGroups?.length === 1 ? preGroups[0].children : preGroups,
          attributes: {
            type: compulsory ? 'compulsory' : 'optional',
          }
        }
      }
    }
    // Study module or error
    return {
      name: prerequisite.moduleGroupId ?? 'no data',
    };
  })
};

const createNodesForPreGroup = (course: CourseUnit): RawNodeDatum[] | undefined => {
  const compulsory = course.compulsoryFormalPrerequisites?.map((preGroup, idx) => {
    return {
      name: `Group C${idx + 1}`,
      children: createNodesForCourse(preGroup),
      attributes: {
        type: 'compulsory',
      }
    };
  }) ?? [];
  const recommended = course.recommendedFormalPrerequisites?.map((preGroup, idx) => {
    return {
      name: `Group O${idx + 1}`,
      children: createNodesForCourse(preGroup, false),
      attributes: {
        type: 'optional',
      }
    };
  }) ?? [];

  return compulsory.concat(recommended);
};

const createNodes = (courseCode: string): RawNodeDatum => {
  const course = indexedCourses.get(courseCode);
  if(course) {
    const preGroups = createNodesForPreGroup(course);
    return {
      name: selectName(course),
      children: preGroups?.length === 1 ? preGroups[0].children : preGroups,
    }
  }
  return emptyTree;
};

const emptyTree: RawNodeDatum = { name: 'No data'};

function App() {
  const [currentCourse, setCurrentCourse] = useState<string>('COMP.CS.350');
  const [searchWord, setSearchWord] = useState<string>('');
  const [nodeData, setNodeData] = useState<RawNodeDatum>(emptyTree);

  useEffect(() => {
    setNodeData(createNodes(currentCourse));
  }, [currentCourse]);

  const courseSearch = (): JSX.Element => (
    <InputGroup style={{ width: '300px' }}>
      <FormControl
        type="text"
        value={searchWord}
        placeholder="Search"
        onChange={(event) => setSearchWord(event.target.value)}
      />
    </InputGroup>
  );

  const courseList = (): JSX.Element => (
    <ListGroup>
      {courseCodes
        .filter((code) => code.toLowerCase().includes(searchWord.toLowerCase()))
        .map((code: string, idx: number) => (
          <ListGroup.Item variant="light" action active={code === currentCourse} key={idx} onClick={() => setCurrentCourse(code)}>
            {code}
          </ListGroup.Item>
        ))
      }
    </ListGroup>
  );

  const courseName = (): string => (
    `${currentCourse} ${selectName(indexedCourses.get(currentCourse))}`
  );

  const courseGraph = (): JSX.Element => (
    <Tree data={nodeData} pathFunc="step" orientation="vertical" translate={{x: 800, y: 200}}/>
  );

  const nabBar = (): JSX.Element => (
    <Navbar variant="dark" style={{ height: '80px', background: '#4E008E' }}>
      {courseSearch()}
      <div style={{ marginLeft: '16px' }}>
        <Navbar.Brand>OPS viewer // {courseName()}</Navbar.Brand>
      </div>
    </Navbar>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {nabBar()}
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div style={{ width: '332px', height: 'calc(100vh - 80px)', overflowY: 'scroll', flexShrink: 0 }}>
          {courseList()}
        </div>
        <div style={{ flexGrow: 1 }}>
          {courseGraph()}
        </div>
      </div>
    </div>
  );
}

export default App;
